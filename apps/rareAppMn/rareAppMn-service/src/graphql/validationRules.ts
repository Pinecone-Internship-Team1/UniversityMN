import {
  GraphQLError,
  Kind,
  type ASTVisitor,
  type FragmentDefinitionNode,
  type SelectionSetNode,
  type ValidationContext,
} from 'graphql';

export function createMaxDepthRule(maxDepth: number) {
  return function MaxDepthRule(context: ValidationContext): ASTVisitor {
    const fragments = new Map<string, FragmentDefinitionNode>();
    for (const definition of context.getDocument().definitions) {
      if (definition.kind === Kind.FRAGMENT_DEFINITION) {
        fragments.set(definition.name.value, definition);
      }
    }
    const fragmentDepths = new Map<string, number>();

    function fragmentDepth(name: string, visiting: Set<string>): number {
      const cached = fragmentDepths.get(name);
      if (cached !== undefined) return cached;
      const fragment = fragments.get(name);
      if (!fragment || visiting.has(name)) return 0;
      visiting.add(name);
      const depth = selectionSetDepth(fragment.selectionSet, visiting);
      visiting.delete(name);
      fragmentDepths.set(name, depth);
      return depth;
    }

    function selectionSetDepth(selectionSet: SelectionSetNode, visiting: Set<string>): number {
      let depth = 0;
      for (const selection of selectionSet.selections) {
        if (selection.kind === Kind.FIELD) {
          if (selection.name.value.startsWith('__')) continue;
          const childDepth = selection.selectionSet
            ? selectionSetDepth(selection.selectionSet, visiting)
            : 0;
          depth = Math.max(depth, childDepth + 1);
        } else if (selection.kind === Kind.INLINE_FRAGMENT) {
          depth = Math.max(depth, selectionSetDepth(selection.selectionSet, visiting));
        } else {
          depth = Math.max(depth, fragmentDepth(selection.name.value, visiting));
        }
      }
      return depth;
    }

    return {
      OperationDefinition(node) {
        const depth = selectionSetDepth(node.selectionSet, new Set());
        if (depth > maxDepth) {
          context.reportError(
            new GraphQLError(
              `Query depth of ${depth} exceeds the maximum allowed depth of ${maxDepth}.`,
              { nodes: [node] }
            )
          );
        }
      },
    };
  };
}

export function createMaxAliasesRule(maxAliases: number) {
  return function MaxAliasesRule(context: ValidationContext): ASTVisitor {
    let aliases = 0;
    return {
      Field(node) {
        if (node.alias) aliases += 1;
      },
      Document: {
        leave() {
          if (aliases > maxAliases) {
            context.reportError(
              new GraphQLError(
                `Query uses ${aliases} aliases, exceeding the maximum of ${maxAliases}.`
              )
            );
          }
        },
      },
    };
  };
}
