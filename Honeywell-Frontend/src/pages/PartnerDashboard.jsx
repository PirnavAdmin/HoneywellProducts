import React from 'react';
import PageHero from '../components/common/PageHero';
import DistributorsDirectory from '../components/business/DistributorsDirectory';
import heroImage from '../assets/images/capital-park2.jpg';

export default function PartnerDashboard() {
  return (
    <>
      <PageHero
        eyebrow="PARTNER PORTAL &amp; COMMERCIAL ECOSYSTEM"
        title="Authorized Distributors &amp; Partner Directory"
        description="Connect directly with verified Honeywell regional distributors, wholesale supply hubs, access project quotes, and commercial pricing."
        image={heroImage}
      />

      <DistributorsDirectory showHeading={false} />
    </>
  );
}
