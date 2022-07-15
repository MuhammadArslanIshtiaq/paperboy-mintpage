import { createGlobalStyle } from "styled-components";
import Rubric from "./fonts/Rubric-Regular.ttf";
const FontStyles = createGlobalStyle`

@font-face {
  font-family: 'Rubric';
  src: url(${Rubric}) format('truetype');
  font-weight: 300;
  font-style: normal;
},

`;

export default FontStyles;
