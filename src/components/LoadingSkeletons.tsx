import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-5">
      {children}
    </motion.div>
  );
}

function Item({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <motion.div variants={fadeUp} className={className}>{children}</motion.div>;
}

/* ─── Dashboard ─── */
export function DashboardSkeleton() {
  return (
    <Wrap>
      {/* Header */}
      <Item><Skeleton className="h-6 w-48" /></Item>

      {/* KPI Cards */}
      <Item className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-2.5 w-20" />
            </CardContent>
          </Card>
        ))}
      </Item>

      {/* Revenue row */}
      <Item className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="w-3.5 h-3.5 rounded" />
                <Skeleton className="h-2.5 w-16" />
              </div>
              <Skeleton className="h-5 w-20" />
            </CardContent>
          </Card>
        ))}
      </Item>

      {/* Products list */}
      <Item>
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="w-7 h-7 rounded-lg" />
              <Skeleton className="h-4 w-40" />
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-7 h-7 rounded-full" />
                <Skeleton className="w-11 h-11 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </Item>
    </Wrap>
  );
}

/* ─── Products ─── */
export function ProductsSkeleton() {
  return (
    <Wrap>
      <Item><Skeleton className="h-6 w-44" /></Item>
      <Item><Skeleton className="h-10 w-full rounded-xl" /></Item>
      <Item className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <Skeleton className="aspect-[3/2] w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-3 w-14" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </Item>
    </Wrap>
  );
}

/* ─── Videos ─── */
export function VideosSkeleton() {
  return (
    <Wrap>
      <Item><Skeleton className="h-6 w-40" /></Item>
      <Item><Skeleton className="h-10 w-full rounded-xl" /></Item>
      <Item className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <Skeleton className="aspect-[9/16] w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <div className="flex gap-2">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-3 w-10" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </Item>
    </Wrap>
  );
}

/* ─── Creators ─── */
export function CreatorsSkeleton() {
  return (
    <Wrap>
      <Item><Skeleton className="h-6 w-44" /></Item>
      <Item><Skeleton className="h-10 w-full rounded-xl" /></Item>
      <Item className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3.5 w-24" />
              </div>
              <Skeleton className="w-9 h-9 rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </Item>
    </Wrap>
  );
}

/* ─── Creatives ─── */
export function CreativesSkeleton() {
  return (
    <Wrap>
      <Item><Skeleton className="h-6 w-36" /></Item>
      <Item className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="break-inside-avoid overflow-hidden">
            <CardContent className="p-0">
              <Skeleton className={`w-full ${i % 3 === 0 ? "aspect-[9/16]" : i % 3 === 1 ? "aspect-square" : "aspect-[3/4]"}`} />
              <div className="p-3 space-y-2">
                <div className="flex gap-1">
                  <Skeleton className="h-4 w-14 rounded-full" />
                  <Skeleton className="h-4 w-12 rounded-full" />
                </div>
                <Skeleton className="h-2.5 w-24" />
                <Skeleton className="h-7 w-full rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </Item>
    </Wrap>
  );
}
