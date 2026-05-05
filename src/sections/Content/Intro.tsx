export interface IntroProps {
  text: string;
  subheading?: string;
  alignment: "Left" | "Center" | "Right";
}

const ALIGNMENT_TEXT = {
  Left: "items-start text-start",
  Center: "items-center text-center",
  Right: "items-end text-end",
};

export default function Intro({
  text = "Lorem ipsum dolor sit amet consectetur. Placerat ornare diam nulla fringilla gravida justo elementum. Ut sed in.",
  subheading,
  alignment = "Left",
}: IntroProps) {
  return (
    <section className="bg-base-100">
      <div className="mx-5 py-10 md:mx-10 md:py-24 xl:container xl:mx-auto">
        <div className={`flex flex-col gap-6 ${ALIGNMENT_TEXT[alignment ?? "Left"]}`}>
          <h1 className="text-[40px] leading-[120%] font-bold text-base-content">{text}</h1>
          {subheading && <p className="text-lg text-base-content">{subheading}</p>}
        </div>
      </div>
    </section>
  );
}
