/** Convert markdown-style [text](url) links in a plain string to HTML anchor tags. */
export function renderLinks(text: string): string {
  return text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline text-accent hover:text-primary transition-colors">$1</a>',
  );
}
