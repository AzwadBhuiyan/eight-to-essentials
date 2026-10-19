/**
 * Single source of truth for authorship details.
 * Every page footer, the About page, the report footer and the HTML meta tags
 * read from here, so a change only needs to be made once.
 * No email address or phone number, by design.
 */
export const author = {
  name: 'Azwad Bhuiyan',
  title: 'Master of Computing (Cyber Security) student, Curtin University',
  location: 'Perth, Western Australia',
  githubUsername: 'AzwadBhuiyan',
  linkedInUrl: 'https://www.linkedin.com/in/azwad-bhuiyan',
} as const;

export const githubProfileUrl = `https://github.com/${author.githubUsername}`;
export const repositoryUrl = `${githubProfileUrl}/eight-to-essentials`;
