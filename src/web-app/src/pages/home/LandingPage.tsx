import { Navbar } from "../../components/home/Navbar";
import { Hero } from "../../components/home/Hero";
import { Features } from "../../components/home/Features";
import { Footer } from "../../components/home/Footer";
import { About } from "../../components/home/About";
import { Contact } from "../../components/home/Contact";

function LandingPage() {
  return (
    <div>
      <Navbar />
      <Hero />
      <Features />
      <About />
      <Contact />
      <Footer />
    </div>
  );
}

export default LandingPage;
