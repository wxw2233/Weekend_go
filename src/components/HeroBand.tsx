import Image from "next/image";
import Link from "next/link";

export default function HeroBand({
  dual,
  total,
}: {
  dual: number;
  total: number;
}) {
  return (
    <section className="relative min-h-[230px] overflow-hidden border-b border-line sm:min-h-[300px]">
      <Image
        src="/images/worker-poster.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[50%_12%]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(243,240,232,0.97)_0%,rgba(243,240,232,0.94)_40%,rgba(243,240,232,0.62)_64%,rgba(243,240,232,0.32)_100%)] sm:bg-[linear-gradient(100deg,rgba(243,240,232,0.96)_0%,rgba(243,240,232,0.92)_42%,rgba(243,240,232,0.55)_70%,rgba(243,240,232,0.22)_100%)]"
      />
      <div className="relative container-page flex min-h-[230px] items-center py-8 sm:min-h-[300px] sm:py-12">
        <div className="max-w-xl">
          <h1 className="text-2xl font-bold leading-snug text-ink drop-shadow-sm sm:text-3xl">
            先问双不双休，再决定买不买
          </h1>
          <p className="mt-2 text-sm font-medium text-haze sm:text-base">
            一周休满两天即算双休（含轮休）· 双休 {dual} · 总计 {total}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:gap-2">
            <Link href="#directory" className="btn-primary w-full sm:w-auto">
              企业库
            </Link>
            <Link href="/sx/submit" className="btn-ghost w-full sm:w-auto">
              提交标注
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
