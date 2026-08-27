export default function SectionHeading({ eyebrow, title, description, align = 'left', inverse = false }) {
  return <div className={`section-heading ${align} ${inverse ? 'inverse' : ''}`}><p className="eyebrow dark">{eyebrow}</p><h2>{title}</h2>{description && <p>{description}</p>}</div>;
}
