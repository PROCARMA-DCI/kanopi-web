import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-[#545E5E]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-5 md:flex-row">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image src="/images/logo.svg" height={58} width={51} alt="Kanopi" />
        </Link>

        {/* Copyright */}
        <p className="text-center text-sm text-white">
          © {new Date().getFullYear()} All Rights Reserved.
        </p>
        <p></p>
      </div>
    </footer>
  );
}
