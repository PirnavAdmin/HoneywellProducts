import { ArrowRight, Check } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHero from '../components/common/PageHero';
import SectionHeading from '../components/common/SectionHeading';
import { applications, getSolutionById, solutions } from '../data/solutions';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import heroImage from '../assets/images/smart-technology-trends.png';

export default function Solutions() {
  useDocumentTitle('Security Solutions', 'Explore solution starting points for homes, offices, retail, warehouses, factories and outdoor sites.');
  const [params] = useSearchParams();
  const selectedSolution = getSolutionById(params.get('solution'));
  const selectedApplication = applications.find((item) => item.id === params.get('application'));
  return <>
    <PageHero eyebrow="SECURITY SOLUTIONS" title="Protect What Matters" description="Start with your environment, then explore suitable product categories with our sales team." image={heroImage} />
    {(selectedSolution || selectedApplication) && <section className="selected-solution"><div className="container"><div><small>SUGGESTED STARTING POINT</small><h2>{selectedSolution?.title || `${selectedApplication.name} Security`}</h2><p>{selectedSolution?.description || selectedApplication.description}</p></div><Link className="button" to={`/products?category=${selectedSolution?.categoryId || selectedApplication.categoryId}`}>Explore Suggested Products <ArrowRight size={17} /></Link></div></section>}
    <section className="section"><div className="container"><SectionHeading eyebrow="SOLUTION PORTFOLIO" title="Complete Security Solutions" description="These solution concepts guide early discovery; final product suitability requires project review." /><div className="solution-grid solution-page-grid">{solutions.map((solution) => <article className="solution-card" key={solution.id}><img src={solution.image} alt={`${solution.title} environment`} /><div><small>{solution.application}</small><h3>{solution.title}</h3><p>{solution.description}</p><ul><li><Check size={15} /> Application-led planning</li><li><Check size={15} /> Scalable product selection</li><li><Check size={15} /> Sales-assisted recommendation</li></ul><Link to={`/products?category=${solution.categoryId}`}>View Suggested Products <ArrowRight size={16} /></Link></div></article>)}</div></div></section>
    <section className="section applications-section"><div className="container"><SectionHeading eyebrow="APPLICATION FINDER" title="Choose Your Environment" description="Select the kind of place you are protecting for a focused starting point." /><div className="application-grid">{applications.map((application) => <Link key={application.id} to={`/solutions?application=${application.id}`} className="application-card"><img src={application.image} alt={`${application.name} security application`} /><div><span>{application.name}</span><p>{application.description}</p><b>View recommendation <ArrowRight size={16} /></b></div></Link>)}</div></div></section>
  </>;
}
