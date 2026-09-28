import RenderHtml, { type MixedStyleDeclaration } from '@native-html/render';
import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { font } from '@/constants/theme';

type QuestionRichTextProps = {
  html: string;
  color: string;
  fontSize: number;
  lineHeight: number;
  weight?: 'regular' | 'medium' | 'bold';
};

const fontFamily = {
  regular: font.regular,
  medium: font.medium,
  bold: font.bold,
} as const;

export function QuestionRichText({ html, color, fontSize, lineHeight, weight = 'regular' }: QuestionRichTextProps) {
  const { width } = useWindowDimensions();
  const baseStyle = useMemo<MixedStyleDeclaration>(() => ({
    color,
    fontFamily: fontFamily[weight],
    fontSize,
    lineHeight,
  }), [color, fontSize, lineHeight, weight]);
  const tagsStyles = useMemo<Record<string, MixedStyleDeclaration>>(() => ({
    body: { margin: 0, padding: 0 },
    p: { marginTop: 0, marginBottom: lineHeight * 0.75 },
    ul: { marginTop: 0, marginBottom: lineHeight * 0.75, paddingLeft: 18 },
    ol: { marginTop: 0, marginBottom: lineHeight * 0.75, paddingLeft: 18 },
    li: { marginBottom: lineHeight * 0.25 },
    blockquote: { marginTop: 0, marginBottom: lineHeight * 0.75, paddingLeft: 10 },
    a: { color, textDecorationLine: 'underline' },
    pre: { fontFamily: font.regular, whiteSpace: 'pre' },
    code: { fontFamily: font.regular },
  }), [color, lineHeight]);

  return (
    <RenderHtml
      baseStyle={baseStyle}
      contentWidth={width}
      source={{ html }}
      tagsStyles={tagsStyles}
    />
  );
}
