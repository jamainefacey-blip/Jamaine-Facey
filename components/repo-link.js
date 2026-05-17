export default function repoLink(file, customText) {
  const text = customText || "The Edge Function code:";

  const root = "https://github.com/jamainefacey-blip/Jamaine-Facey/tree/main/pages";

  return `${text} <a href="${root}/${file}" target="_BLANK" rel="noopener">${file}</a>`;
}
