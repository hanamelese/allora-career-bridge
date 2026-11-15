/**
 * The embed tag, written for the places partners put it: plain HTML,
 * React, Next.js, Vue, Angular, Svelte, WordPress and PHP.
 *
 * Every snippet does the same three things in that framework's own way:
 * loads the widget script once, places <onboarding-form> with the pinned
 * form, key, version and language, and receives the answers from the
 * `onboarding-submit` event (plain JSON, files as File objects), saving
 * them with `waitUntil` so the form says "sent" only once that worked.
 *
 * Pure functions with no browser or Vite dependency, so they are tested
 * directly (embedSnippets.test.js). Only the public key goes in a page;
 * nothing here ever sees the secret key.
 */

/** Where the example sends the answers. A placeholder the partner replaces. */
export const ANSWERS_ENDPOINT = '/your-endpoint';

const SAVE_COMMENT = '// answers: plain JSON; files: File objects';

function attributeLines({ formId, publicKey, version, language }, indent) {
  return [
    `${indent}form-id="${formId}"`,
    `${indent}public-key="${publicKey}"`,
    `${indent}form-version="${version}"`,
    `${indent}lang="${language}"`,
  ];
}

/* The saving step, shared by the plain-JS snippets. */
function saveBlock(indent) {
  return [
    `${indent}event.detail.waitUntil(`,
    `${indent}  fetch('${ANSWERS_ENDPOINT}', {`,
    `${indent}    method: 'POST',`,
    `${indent}    headers: { 'Content-Type': 'application/json' },`,
    `${indent}    body: JSON.stringify(answers),`,
    `${indent}  }).then((response) => {`,
    `${indent}    if (!response.ok) throw new Error('Not saved');`,
    `${indent}  }),`,
    `${indent});`,
  ];
}

/* Adds the widget script once, however many forms or re-renders there are. */
function loadScriptLines(src, indent) {
  return [
    `${indent}if (!document.querySelector('script[src="${src}"]')) {`,
    `${indent}  const script = document.createElement('script');`,
    `${indent}  script.src = '${src}';`,
    `${indent}  script.async = true;`,
    `${indent}  document.head.append(script);`,
    `${indent}}`,
  ];
}

function html(form) {
  return [
    `<script src="${form.widgetSrc}" async></script>`,
    '',
    '<onboarding-form',
    ...attributeLines(form, '  ').map((line, index, all) => (index === all.length - 1 ? `${line}>` : line)),
    '</onboarding-form>',
    '',
    '<script>',
    "  document.addEventListener('onboarding-submit', (event) => {",
    `    const { answers, files } = event.detail; ${SAVE_COMMENT}`,
    '    // Optional: make the form wait for your save, so it says "sent" only once it worked.',
    ...saveBlock('    '),
    '  });',
    '</script>',
  ].join('\n');
}

function reactComponent(form, { next }) {
  const lines = [];
  if (next) lines.push("'use client';", '');
  if (next) lines.push("import Script from 'next/script';");
  lines.push("import { useEffect, useRef } from 'react';", '');
  if (!next) lines.push(`const WIDGET_SRC = '${form.widgetSrc}';`, '');
  lines.push(
    `export ${next ? 'default ' : ''}function OnboardingForm() {`,
    '  const formRef = useRef(null);',
    '',
    '  useEffect(() => {',
  );
  if (!next) {
    lines.push(
      '    // Add the widget script once, however often this renders.',
      '    if (!document.querySelector(`script[src="${WIDGET_SRC}"]`)) {',
      "      const script = document.createElement('script');",
      '      script.src = WIDGET_SRC;',
      '      script.async = true;',
      '      document.head.append(script);',
      '    }',
      '',
    );
  }
  lines.push(
    '    const form = formRef.current;',
    '    function handleSubmit(event) {',
    `      const { answers, files } = event.detail; ${SAVE_COMMENT}`,
    ...saveBlock('      '),
    '    }',
    "    form.addEventListener('onboarding-submit', handleSubmit);",
    "    return () => form.removeEventListener('onboarding-submit', handleSubmit);",
    '  }, []);',
    '',
    '  return (',
  );
  const indent = next ? '      ' : '    ';
  const element = [
    `${indent}<onboarding-form`,
    `${indent}  ref={formRef}`,
    ...attributeLines(form, `${indent}  `),
    `${indent}/>`,
  ];
  if (next) {
    lines.push('    <>', `      <Script src="${form.widgetSrc}" strategy="afterInteractive" />`, ...element, '    </>');
  } else {
    lines.push(...element);
  }
  lines.push('  );', '}');
  return lines.join('\n');
}

function react(form) {
  return reactComponent(form, { next: false });
}

function nextjs(form) {
  return reactComponent(form, { next: true });
}

function vue(form) {
  return [
    '<!-- OnboardingForm.vue -->',
    '<!-- In vite.config.js, tell Vue this is a web component:',
    "     vue({ template: { compilerOptions: { isCustomElement: (tag) => tag === 'onboarding-form' } } }) -->",
    '<script setup>',
    "import { onMounted } from 'vue';",
    '',
    'onMounted(() => {',
    ...loadScriptLines(form.widgetSrc, '  '),
    '});',
    '',
    'function handleSubmit(event) {',
    `  const { answers, files } = event.detail; ${SAVE_COMMENT}`,
    ...saveBlock('  '),
    '}',
    '</script>',
    '',
    '<template>',
    '  <onboarding-form',
    ...attributeLines(form, '    '),
    '    @onboarding-submit="handleSubmit"',
    '  ></onboarding-form>',
    '</template>',
  ].join('\n');
}

function angular(form) {
  return [
    '// onboarding-form.component.ts',
    '// Add the widget script once, in src/index.html inside <head>:',
    `//   <script src="${form.widgetSrc}" async></script>`,
    "import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';",
    '',
    '@Component({',
    "  selector: 'app-onboarding-form',",
    '  standalone: true,',
    '  schemas: [CUSTOM_ELEMENTS_SCHEMA],',
    '  template: `',
    '    <onboarding-form',
    ...attributeLines(form, '      '),
    '      (onboarding-submit)="handleSubmit($event)"',
    '    ></onboarding-form>',
    '  `,',
    '})',
    'export class OnboardingFormComponent {',
    '  handleSubmit(event: Event) {',
    `    const { answers, files } = (event as CustomEvent).detail; ${SAVE_COMMENT}`,
    ...saveBlock('    ').map((line, index) => (index === 0 ? '    (event as CustomEvent).detail.waitUntil(' : line)),
    '  }',
    '}',
  ].join('\n');
}

function svelte(form) {
  return [
    '<!-- OnboardingForm.svelte -->',
    '<script>',
    "  import { onMount } from 'svelte';",
    '',
    '  let form;',
    '',
    '  onMount(() => {',
    ...loadScriptLines(form.widgetSrc, '    '),
    '',
    '    function handleSubmit(event) {',
    `      const { answers, files } = event.detail; ${SAVE_COMMENT}`,
    ...saveBlock('      '),
    '    }',
    "    form.addEventListener('onboarding-submit', handleSubmit);",
    "    return () => form.removeEventListener('onboarding-submit', handleSubmit);",
    '  });',
    '</script>',
    '',
    '<onboarding-form',
    '  bind:this={form}',
    ...attributeLines(form, '  '),
    '></onboarding-form>',
  ].join('\n');
}

function wordpress(form) {
  return [
    '<!-- In the block editor: add a "Custom HTML" block where the form should appear, and paste this. -->',
    html(form),
  ].join('\n');
}

function php(form) {
  return [
    '<?php',
    '// In your PHP template, where the form should appear.',
    '$onboardingForm = [',
    `    'formId' => '${form.formId}',`,
    `    'publicKey' => '${form.publicKey}',`,
    `    'version' => ${Number(form.version)},`,
    `    'lang' => '${form.language}',`,
    '];',
    '$e = fn ($value) => htmlspecialchars((string) $value, ENT_QUOTES);',
    '?>',
    `<script src="${form.widgetSrc}" async></script>`,
    '',
    '<onboarding-form',
    '  form-id="<?= $e($onboardingForm[\'formId\']) ?>"',
    '  public-key="<?= $e($onboardingForm[\'publicKey\']) ?>"',
    '  form-version="<?= $e($onboardingForm[\'version\']) ?>"',
    '  lang="<?= $e($onboardingForm[\'lang\']) ?>">',
    '</onboarding-form>',
    '',
    '<script>',
    "  document.addEventListener('onboarding-submit', (event) => {",
    `    const { answers, files } = event.detail; ${SAVE_COMMENT}`,
    ...saveBlock('    ').map((line) => line.replace(ANSWERS_ENDPOINT, '/save-answers.php')),
    '  });',
    '</script>',
    '<?php',
    '/* save-answers.php, beside this page, receives the answers:',
    "     $answers = json_decode(file_get_contents('php://input'), true);",
    '     if (!is_array($answers)) { http_response_code(400); exit; }',
    '     // Save $answers in your own database here.',
    '     http_response_code(204);',
    '*/',
    '?>',
  ].join('\n');
}

/** Tabs, in the order they are shown. `kind` is used by the tests. */
export const FRAMEWORKS = [
  { id: 'html', label: 'HTML', kind: 'html', build: html },
  { id: 'react', label: 'React', kind: 'jsx', build: react },
  { id: 'nextjs', label: 'Next.js', kind: 'jsx', build: nextjs },
  { id: 'vue', label: 'Vue', kind: 'vue', build: vue },
  { id: 'angular', label: 'Angular', kind: 'ts', build: angular },
  { id: 'svelte', label: 'Svelte', kind: 'svelte', build: svelte },
  { id: 'wordpress', label: 'WordPress', kind: 'html', build: wordpress },
  { id: 'php', label: 'PHP', kind: 'php', build: php },
];

export const DEFAULT_FRAMEWORK = 'html';

export function findFramework(id) {
  return FRAMEWORKS.find((framework) => framework.id === id) ?? FRAMEWORKS[0];
}

/**
 * The snippet for one framework.
 * @param {string} frameworkId
 * @param {{formId: string, publicKey: string, version: number, language: string, widgetSrc: string}} form
 */
export function buildSnippet(frameworkId, form) {
  return findFramework(frameworkId).build(form);
}
