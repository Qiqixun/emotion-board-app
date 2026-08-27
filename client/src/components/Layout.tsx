import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';

const Layout = () => {
  return (
    <div className="w-full h-screen overflow-hidden bg-background">

      {/* 页面内容 */}
      <Outlet />


      {/* 消息提示 */}
      <Toaster
        position="top-center"
        richColors
        closeButton
      />

    </div>
  );
};

export default Layout;
