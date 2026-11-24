const traceSteps = [
  'A student asks an inspection agent which devices were used. The agent names a camera and a temperature sensor. The student checks whether each claim can be traced to the run record.',
  'The retrieved inspection note records a camera but contains no evidence that a temperature sensor was used. The student identifies which claim the available source supports.',
  'The student revises the agent instructions to cite evidence for each device and flag missing information. A second run checks whether the unsupported claim reappears.'
];
const stepButtons = document.querySelectorAll('[data-step]');
for (const button of stepButtons) {
  button.addEventListener('click', () => {
    document.getElementById('trace').textContent = traceSteps[Number(button.dataset.step)];
    for (const item of stepButtons) item.setAttribute('aria-pressed', String(item === button));
  });
}
