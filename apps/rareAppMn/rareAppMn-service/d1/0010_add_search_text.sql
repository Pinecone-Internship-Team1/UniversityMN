ALTER TABLE `faculties` ADD `search_text` text;--> statement-breakpoint
ALTER TABLE `majors` ADD `search_text` text;--> statement-breakpoint
ALTER TABLE `schools` ADD `aliases` text;--> statement-breakpoint
ALTER TABLE `schools` ADD `search_text` text;--> statement-breakpoint
ALTER TABLE `schools` ADD `search_aliases` text;--> statement-breakpoint
-- Short names, our URL slugs and the English names/abbreviations from each university's own website.
-- The search_text / search_aliases columns are filled by data-import/backfill-search-text.mjs (it needs src/lib/search.ts).
UPDATE `schools` SET `aliases` = '["МУИС","muis","NUM","National University of Mongolia"]' WHERE `id` = 'sch_muis';--> statement-breakpoint
UPDATE `schools` SET `aliases` = '["ШУТИС","shutis","MUST","Mongolian University of Science and Technology"]' WHERE `id` = 'sch_shutis';--> statement-breakpoint
UPDATE `schools` SET `aliases` = '["СЭЗИС","sezis","UFE","University of Finance and Economics"]' WHERE `id` = 'sch_sezis';--> statement-breakpoint
UPDATE `schools` SET `aliases` = '["АШУҮИС","ashuuis","MNUMS","Mongolian National University of Medical Sciences"]' WHERE `id` = 'sch_ashuuis';--> statement-breakpoint
UPDATE `schools` SET `aliases` = '["ХААИС","haais","khaais","MULS","Mongolian University of Life Sciences"]' WHERE `id` = 'sch_khaais';--> statement-breakpoint
UPDATE `schools` SET `aliases` = '["МУБИС","mubis","MNUE","MSUE","Mongolian National University of Education"]' WHERE `id` = 'sch_mubis';--> statement-breakpoint
UPDATE `schools` SET `aliases` = '["Отгонтэнгэр","ОТИС","otgontenger","Otgontenger University"]' WHERE `id` = 'sch_otgontenger';--> statement-breakpoint
UPDATE `schools` SET `aliases` = '["СУИС","suis","MNUAC","MSUAC","Mongolian National University of Arts and Culture"]' WHERE `id` = 'sch_suis';--> statement-breakpoint
UPDATE `schools` SET `aliases` = '["Хүрээ","huree","Huree University of ICT"]' WHERE `id` = 'sch_huree';--> statement-breakpoint
UPDATE `schools` SET `aliases` = '["ОУУБИС","ouubis","IUU","International University of Ulaanbaatar"]' WHERE `id` = 'sch_iuu';--> statement-breakpoint
UPDATE `schools` SET `aliases` = '["Этүгэн","etugen","Etugen University"]' WHERE `id` = 'sch_etugen';
