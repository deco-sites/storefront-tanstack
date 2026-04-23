import React from "react";
import { JSX } from "react";
import { clx } from "~/sdk/clx";

export interface Props {
  /** @description Section title */
  title?: string;

  /** @description See all link */
  cta?: string;
}

function Header({ title, cta }: Props) {
  if (!title) {
    return null;
  }

  return (
    <div className={clx("flex items-center justify-between gap-2", "px-5 sm:px-0")}>
      <span className="text-2xl font-semibold sm:text-3xl">{title}</span>
      {cta && (
        <a className="text-sm font-medium text-primary" href={cta}>
          See all
        </a>
      )}
    </div>
  );
}

function Tabbed({ children }: { children: JSX.Element }) {
  return <>{children}</>;
}

function Container({ className: _class, ...props }: React.JSX.IntrinsicElements["div"]) {
  return (
    <div
      {...props}
      className={clx(
        "container flex w-full flex-col gap-4 py-5 sm:gap-6 sm:py-10",
        _class?.toString(),
      )}
    />
  );
}

function Placeholder({ height, className: _class }: { height: string; className?: string }) {
  return (
    <div
      style={{
        height,
        containIntrinsicSize: height,
        contentVisibility: "auto",
      }}
      className={clx("flex items-center justify-center", _class)}
    >
      <span className="loading loading-spinner" />
    </div>
  );
}

function Section() {}

Section.Container = Container;
Section.Header = Header;
Section.Tabbed = Tabbed;
Section.Placeholder = Placeholder;

export default Section;
