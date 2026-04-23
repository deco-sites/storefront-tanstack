import { HTMLWidget } from "~/types/widgets";
import Section, {
  type Props as SectionHeaderProps,
} from "../../components/ui/Section";

/** @titleBy question */
export interface Question {
  /**
   * @title Question
   * @description Heading shown on the collapsible item
   */
  question: string;
  /**
   * @title Answer
   * @description Rich-text body revealed when the question is expanded
   */
  answer: HTMLWidget;
}

export interface ContactLink {
  /**
   * @title Link text
   * @description Anchor copy shown on the contact CTA
   */
  text: string;
  /**
   * @title Link URL
   * @description Internal route or external URL
   */
  href: string;
}

export interface Contact {
  /**
   * @title Title
   * @description Heading for the post-FAQ contact block
   */
  title?: string;
  /**
   * @title Description
   * @description Body text for the contact block
   */
  description?: HTMLWidget;
  /**
   * @title CTA
   * @description Optional call-to-action link
   */
  link?: ContactLink;
}

export interface Props extends SectionHeaderProps {
  /**
   * @title Questions
   * @description List of FAQ entries rendered as a collapsible accordion
   */
  questions?: Question[];
  /**
   * @title Contact block
   * @description Optional follow-up section with title/description/CTA
   */
  contact?: Contact;
}

function QuestionItem(
  { question, answer }: { question: string; answer: HTMLWidget },
) {
  return (
    <details className="collapse collapse-arrow border-t border-base-200">
      <summary className="collapse-title text-lg font-medium">
        {question}
      </summary>
      <div
        className="collapse-content"
        dangerouslySetInnerHTML={{ __html: answer }}
      />
    </details>
  );
}

function Contact({ title, description, link }: Contact) {
  return (
    <div className="flex flex-col gap-6 items-center text-center">
      <div className="flex flex-col gap-2">
        {title && <h2 className="text-xl lg:text-3xl">{title}</h2>}
        {description && (
          <div
            className="text-lg lg:text-xl"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}
      </div>
      {link &&
        <a href={link.href} className="btn">{link.text}</a>}
    </div>
  );
}

export default function FAQ({
  title,
  cta,
  questions = [
    {
      question: "How do I track my order?",
      answer:
        "Tracking your order is easy! As soon as your order ships, we'll send a confirmation email with a tracking number. Just click the tracking number or visit our site and enter the number in the designated section to get real-time updates on the location and delivery status of your order.",
    },
    {
      question: "What is your return policy?",
      answer:
        "We offer a hassle-free return policy. If you're not completely satisfied with your purchase, you can return the item within 30 days of delivery for a full refund or exchange. Please make sure the item is unused, in its original packaging, and accompanied by the receipt. Contact our customer service team and they'll guide you through the return process.",
    },
  ],
  contact = {
    title: "",
    description: "",
    link: {
      text: "",
      href: "",
    },
  },
}: Props) {
  return (
    <Section.Container>
      <Section.Header title={title} cta={cta} />

      <ul className="w-full">
        {questions.map((question) => (
          <li key={question.question}>
            <QuestionItem
              question={question.question}
              answer={question.answer}
            />
          </li>
        ))}
      </ul>

      <Contact {...contact} />
    </Section.Container>
  );
}
