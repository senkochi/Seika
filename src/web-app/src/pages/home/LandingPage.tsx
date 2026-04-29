import { Navbar } from "../../components/home/Navbar";
import { Hero } from "../../components/home/Hero";
import { Features } from "../../components/home/Features";
import { Footer } from "../../components/home/Footer";

function LandingPage() {
  return (
    <div>
      <Navbar />
      <Hero />
      <Features />
      <Footer />
    </div>
  );
}

export default LandingPage;
