import Footer from '../Footer';
import NavBar from '../NavBar';
import { Outlet } from 'react-router';

const RootLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default RootLayout;
