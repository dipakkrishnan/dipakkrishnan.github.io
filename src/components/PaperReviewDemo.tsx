import { useMemo, useState } from 'react';

type PaperReviewDemoProps = {
  mode?: 'rubric' | 'instructions';
};

const rubricItems = [
  { label: 'Claim', detail: 'What is the central technical claim, and what would falsify it?' },
  { label: 'Evidence', detail: 'Which experiment, proof, or ablation most directly supports the claim?' },
  { label: 'Reviewer Lens', detail: 'What should an expert check before trusting the result?' },
];

export default function PaperReviewDemo({ mode = 'rubric' }: PaperReviewDemoProps) {
  const [selected, setSelected] = useState(0);
  const item = rubricItems[selected];
  const title = mode === 'instructions' ? 'Instruction Review' : 'Paper Review Rubric';

  const nextLabel = useMemo(() => {
    const next = rubricItems[(selected + 1) % rubricItems.length];
    return `Next: ${next.label}`;
  }, [selected]);

  return (
    <section className="interactive-panel" aria-label={title}>
      <h3>{title}</h3>
      <p><strong>{item.label}.</strong> {item.detail}</p>
      <button type="button" onClick={() => setSelected((selected + 1) % rubricItems.length)}>
        {nextLabel}
      </button>
    </section>
  );
}
