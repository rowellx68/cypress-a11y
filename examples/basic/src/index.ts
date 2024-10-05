setTimeout(() => {
  const link = document.querySelector(
    '[data-testid="link-duckduck-go"]',
  ) as HTMLAnchorElement;
  link.innerText = 'link';
}, 500);
