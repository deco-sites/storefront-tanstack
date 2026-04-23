import Section from "../../components/ui/Section";

export { default, loader } from "../../components/search/SearchResult";

export const LoadingFallback = () => <Section.Placeholder height="635px" />;

export const cache = "listing";
