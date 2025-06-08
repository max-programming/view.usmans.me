import type { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface Database {
  users: UsersTable;
  images: ImagesTable;
}

export interface UsersTable {
  id: Generated<number>;
  username: string;
  password: string;
}

export interface ImagesTable {
  id: Generated<number>;
  title: string;
  slug: string;
  description?: string;
  fileKey: string;
  visibility: "public" | "unlisted" | "private";
}

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

export type Image = Selectable<ImagesTable>;
export type NewImage = Insertable<ImagesTable>;
export type ImageUpdate = Updateable<ImagesTable>;
