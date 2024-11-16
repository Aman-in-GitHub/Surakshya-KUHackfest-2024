import { Text as RnText, TextStyle } from 'react-native';
import React from 'react';
import { createStyleSheet, useStyles } from 'react-native-unistyles';

function Text({
  children,
  isBlack,
  isBold,
  style,
  numberOfLines
}: {
  children: React.ReactNode;
  isBlack?: boolean;
  isBold?: boolean;
  style?: TextStyle;
  numberOfLines?: number;
}) {
  const { styles, theme } = useStyles(stylesheet);

  return (
    <RnText
      style={[
        styles.textStyle,
        {
          color: isBlack ? theme.colors.blackColor : styles.textStyle.color,
          fontFamily: isBold ? 'BoldBodyTextFont' : 'BodyTextFont'
        },
        style
      ]}
      adjustsFontSizeToFit={true}
      numberOfLines={numberOfLines}
    >
      {children}
    </RnText>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  textStyle: {
    color: theme.colors.whiteColor,
    fontFamily: 'BodyTextFont',
    fontSize: theme.fontSize.original
  }
}));

export default Text;
