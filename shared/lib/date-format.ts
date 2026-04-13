"use client";
import { useLocale } from "next-intl";
import { format as dateFnsFormat } from "date-fns";
import { zhCN } from "date-fns/locale/zh-CN";
import { enUS } from "date-fns/locale/en-US";

export function useFormatDate() {
  const locale = useLocale();
  return (date: Date | number, formatStr: string) =>
    dateFnsFormat(date, formatStr, { locale: locale === "zh" ? zhCN : enUS });
}
