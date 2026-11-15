/* The page shown for an address the dashboard does not know. */
export default {
  heading: 'Page not found',
  title: 'This page does not exist',
  description: 'The address may have been mistyped. Go back to the first form to carry on.',
  goTo: (formName) => `Go to ${formName}`,
};
