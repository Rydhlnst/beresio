import Image, { type ImageProps } from "next/image";
import { Button } from "@repo/ui/button";
import styles from "./page.module.css";
import { Hero } from "./_components/Hero";
import { WhyChooseUs } from "./_components/WhyChooseUs";
import { ValueProposition } from "./_components/ValueProposition";
import { SavingsCalculator } from "./_components/SavingsCalculator";
import { FAQ } from "./_components/FAQ";

export default function Home() {
  return (
    <>
      <Hero />
      <ValueProposition />
      <WhyChooseUs />
      <SavingsCalculator />
      <FAQ />
    </>
  );
}
