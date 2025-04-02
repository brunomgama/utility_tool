export const formatDate = (date: Date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return "Invalid date";
    }

    return new Intl.DateTimeFormat("de-DE", {day: "2-digit", month: "2-digit", year: "numeric",})
        .format(date)
        .replaceAll(".", "/");
}