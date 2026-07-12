import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";

/** 404 page - brutalist typographic treatment. */
export default function NotFoundPage(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="grid gap-6"
      >
        <p className="font-display text-[12rem] font-bold leading-none tracking-tighter text-foreground/[0.04] select-none">
          404
        </p>
        <div className="-mt-24">
          <h1 className="font-display text-4xl font-bold text-foreground sm:text-5xl">
            Page Not Found
          </h1>
          <p className="mt-4 text-muted-foreground">
            This route doesn't exist on the venue map.
          </p>
          <Link
            className="mt-8 inline-flex items-center gap-2 border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-white/[0.08]"
            to="/"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
