import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]): string => {
  return twMerge(clsx(inputs));
};

export const getLocalStorageModel = (
  models: { name: string }[],
  key: string
): string | undefined => {
  return models.find((m) => m.name === localStorage.getItem(key))?.name;
};
