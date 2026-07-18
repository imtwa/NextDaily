import { getAllReports } from '@/lib/report-utils';
import HomePageClient from './home-page-client';

export default function HomePage() {
    const reports = getAllReports();
    return <HomePageClient reports={reports} />;
}
