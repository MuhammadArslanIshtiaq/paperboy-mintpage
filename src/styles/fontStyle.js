import { createGlobalStyle } from "styled-components";
import Megusto from "./fonts/Megusto.otf";
const FontStyles = createGlobalStyle`

@font-face {
  font-family: 'Megusto';
  src: url(${Megusto}) format('truetype');
  font-weight: 300;
  font-style: normal;
},

`;

export default FontStyles;
