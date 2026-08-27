import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';

const Layout = () => {
  return (
    <div className="w-screen h-screen">
      <Outlet />
      <Toaster position="top-center" />
    </div>
  );
};

export default Layout;
