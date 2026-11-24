const exampleButtons = document.querySelectorAll('[data-example]');
const explanation = document.getElementById('exampleText');
for (const button of exampleButtons) {
  button.addEventListener('click', () => {
    for (const item of exampleButtons) item.setAttribute('aria-pressed', String(item === button));
    explanation.textContent = button.dataset.example;
  });
}
