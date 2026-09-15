import Nav from "./components/Nav";
import Footer from "./components/Footer";
import GlowCursor from "./components/GlowCursor";
import ToTop from "./components/ToTop";
import Hero from "./sections/Hero";
import About from "./sections/About";
import Experience from "./sections/Experience";
import Projects from "./sections/Projects";
import Skills from "./sections/Skills";
import Education from "./sections/Education";
import Contact from "./sections/Contact";
import { useScrollEngine } from "./hooks";

export default function App() {
  useScrollEngine();

  return (
    <>
      <a className="skip" href="#main">Skip to main content</a>
      <GlowCursor />
      <Nav />

      <main id="main">
        <Hero />
        <About />
        <Experience />
        <Projects />
        <Skills />
        <Education />
        <Contact />
      </main>

      <Footer />
      <ToTop />
    </>
  );
}
