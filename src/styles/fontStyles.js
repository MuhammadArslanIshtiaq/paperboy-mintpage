import { createGlobalStyle } from "styled-components";
import wonder from "./fonts/Helvetica-Bold-Font.ttf";
const FontStyles = createGlobalStyle`

@font-face {
  font-family: 'wonder';
  src: url(${wonder}) format('truetype');
  font-weight: 300;
  font-style: normal;
}
`;

export default FontStyles;
