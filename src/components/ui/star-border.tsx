import { ReactNode } from "react";
import "./star-border.css";

interface StarBorderProps {
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  color?: string;
  speed?: string;
  thickness?: number;
  children: ReactNode;
  style?: React.CSSProperties;
  [key: string]: any;
}

const StarBorder = ({
  as: Component = "div",
  className = "",
  color = "white",
  speed = "6s",
  thickness = 1,
  children,
  style,
  ...rest
}: StarBorderProps) => {
  return (
    <div className="relative overflow-hidden rounded-lg border border-primary/30 bg-gradient-to-r from-card/50 to-card/30 backdrop-blur-sm p-[2px]">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-lg animate-pulse"></div>
      <div className="relative bg-card/90 backdrop-blur-sm rounded-lg overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default StarBorder;