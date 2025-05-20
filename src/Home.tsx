import SiteNav from './component/SiteNav'
import Footer from './component/Footer'
import ProfileTop from './component/ProfileTop';
import Auth from './component/Auth';
import AppBanner from './component/AppBanner'
import ProfileQuote from './component/ProfileQuote'

function Home() {
  return (
    <div>
      <SiteNav/>
      <ProfileTop/>
      <Auth/>
      <AppBanner/>
      <ProfileQuote/>
      <Footer/>
    </div>
  )
}

export default Home
/*

*/