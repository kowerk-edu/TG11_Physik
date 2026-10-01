import { loadCourseName, applyCourseName } from './branding.js';

loadCourseName().then(applyCourseName).catch(error => {
  console.error(error);
});
