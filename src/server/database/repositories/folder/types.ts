import z from 'zod';

import { FolderPathSchema } from '#db/repositories/client/types';
import { EnabledSchema, t } from '#server/utils/types';

/** a folder only exists through its clients, so the path is never null here */
const path = FolderPathSchema.unwrap();

export const FolderToggleSchema = z.object({
  path: path,
  enabled: EnabledSchema,
});

export type FolderToggleType = z.infer<typeof FolderToggleSchema>;

export const FolderRenameSchema = z
  .object({
    from: path,
    to: path,
  })
  .refine((v) => v.to !== v.from && !v.to.startsWith(`${v.from}/`), {
    message: t('zod.folder.intoDescendant'),
  });

export type FolderRenameType = z.infer<typeof FolderRenameSchema>;

export const ClientFolderSchema = z.object({
  folder: FolderPathSchema,
});

export type ClientFolderType = z.infer<typeof ClientFolderSchema>;
