<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Server-side rendering for the banner element. This is the PHP twin of the
 * JS canvas renderer in editor/js/editor.js — both read the exact same JSON
 * shape (one "slide" object per banner frame). Keeping the two renderers in
 * sync is the ongoing maintenance cost of this architecture; when you add a
 * new visual control in the JS editor, add its output here too.
 */
class JCS_Render {

	public static function defaults() {
		$studio = class_exists( 'JCS_Settings' ) ? JCS_Settings::get() : array( 'eyebrow_bg'=>'#3157DF','button_bg'=>'#3157DF','dash_color'=>'#3157DF' );
		return array(
			'eyebrow'               => '',
			'heading'                => '',
			'subheading'             => '',
			'buttonText'             => '',
			'buttonUrl'              => '#',
			'buttonNewTab'           => false,
			'altText'                => '',
			'desktopImage'           => '',
			'mobileImage'            => '',
			'desktopBgLink'          => '',
			'mobileBgLink'           => '',
			'desktopBgNewTab'        => false,
			'mobileBgNewTab'         => false,
			'showContent'            => true,
			'mobileShowContent'      => true,
			'bgColor'                => '#ffffff',
			'overlayType'            => 'none',
			'overlayColor'           => '#000000',
			'overlayOpacity'         => 30,
			'overlayBlendMode'       => 'normal',
			'overlayImage'           => '',
			'desktopFit'             => 'width',
			'desktopAttachment'      => 'scroll',
			'contentSide'            => 'left',
			'desktopX'               => 50,
			'desktopY'               => 50,
			'desktopZoom'            => 100,
			'mobileX'                => 50,
			'mobileY'                => 23,
			'mobileWidth'            => 100,
			'gradient'               => array(
				'type'    => 'off',
				'angle'   => 90,
				'radialX' => 0,
				'radialY' => 50,
				'stops'   => array(
					array( 'pos' => 0, 'color' => '#000000', 'opacity' => 0.82 ),
					array( 'pos' => 32, 'color' => '#000000', 'opacity' => 0.60 ),
					array( 'pos' => 60, 'color' => '#000000', 'opacity' => 0.15 ),
					array( 'pos' => 78, 'color' => '#000000', 'opacity' => 0 ),
				),
			),
			'mobileGradient'         => null, // falls back to `gradient` if absent.
			'headingColor'           => '#1a1a1a',
			'subColor'               => '#444444',
			'eyebrowBg'              => $studio['eyebrow_bg'],
			'eyebrowColor'           => '#ffffff',
			'eyebrowBgEnabled'       => true,
			'eyebrowOpacity'         => 100,
			'eyebrowPadX'            => 12,
			'eyebrowPadY'            => 5,
			'eyebrowRadius'          => 2,
			'buttonBg'               => $studio['button_bg'],
			'buttonColor'            => '#ffffff',
			'buttonBgEnabled'        => true,
			'buttonOpacity'          => 100,
			'buttonPadX'             => 30,
			'buttonHeight'           => 48,
			'buttonRadius'           => 2,
			'arrowBg'                => '#000000',
			'arrowBgOpacity'         => 45,
			'arrowIconColor'         => '#ffffff',
			'arrowBorderColor'       => '#ffffff',
			'arrowBorderOpacity'     => 35,
			'dashColor'              => $studio['dash_color'],
			'headingFont'            => 'Oswald',
			'bodyFont'               => 'Inter',
			'eyebrowFont'            => 'Oswald',
			'buttonFont'             => 'Oswald',
			'headingWeight'          => 700,
			'bodyWeight'             => 400,
			'eyebrowWeight'          => 600,
			'buttonWeight'           => 700,
			'eyebrowSize'            => 12,
			'headingSize'            => 46,
			'subSize'                => 16,
			'buttonFontSize'         => 14,
			'contentWidth'           => 480,
			'mobileEyebrowSize'      => null,
			'mobileHeadingSize'      => null,
			'mobileSubSize'          => null,
			'mobileButtonFontSize'   => null,
			'mobileContentWidth'     => null,
			'textAlign'              => 'left',
			'mobileTextAlign'        => 'left',
			'eyebrowLetterSpacing'   => 2.2,
			'headingLetterSpacing'   => 0,
			'subLetterSpacing'       => 0,
			'buttonLetterSpacing'    => 0.6,
			'mobileEyebrowLetterSpacing' => null,
			'mobileHeadingLetterSpacing' => null,
			'mobileSubLetterSpacing' => null,
			'mobileButtonLetterSpacing' => null,
			'eyebrowShiftX'          => 0,
			'eyebrowShiftY'          => 0,
			'headingShiftX'          => 0,
			'headingShiftY'          => 0,
			'subShiftX'              => 0,
			'subShiftY'              => 0,
			'buttonShiftX'           => 0,
			'buttonShiftY'           => 0,
			'buttonWidth'            => 0,
			'mobileEyebrowShiftX'    => 0,
			'mobileEyebrowShiftY'    => 0,
			'mobileHeadingShiftX'    => 0,
			'mobileHeadingShiftY'    => 0,
			'mobileSubShiftX'        => 0,
			'mobileSubShiftY'        => 0,
			'mobileButtonShiftX'     => 0,
			'mobileButtonShiftY'     => 0,
			'mobileButtonWidth'      => 0,
			'headingLineHeight'      => 1.1,
			'subLineHeight'          => 1.55,
			'buttonHoverEnabled'     => false,
			'buttonHoverBg'          => '#1a1a1a',
			'buttonHoverColor'       => '#ffffff',
			'eyebrowShadowEnabled'   => false,
			'eyebrowShadowColor'     => '#000000',
			'eyebrowShadowOpacity'   => 25,
			'eyebrowShadowBlur'      => 8,
			'eyebrowShadowY'         => 2,
			'buttonShadowEnabled'    => false,
			'buttonShadowColor'      => '#000000',
			'buttonShadowOpacity'    => 25,
			'buttonShadowBlur'       => 12,
			'buttonShadowY'          => 4,
			'contentAlign'           => 'center',
			'contentPadding'         => 64,
			'contentShiftX'          => 0,
			'contentShiftY'          => 0,
			'gapEyebrow'             => 20,
			'gapHeading'             => 16,
			'gapSub'                 => 28,
			'mobileGapEyebrow'       => null,
			'mobileGapHeading'       => null,
			'mobileGapSub'           => null,
			'mobileContentSide'      => null,
			'mobileContentAlign'     => null,
			'mobileContentPadding'   => null,
			'mobileContentShiftX'    => 0,
			'mobileContentShiftY'    => 0,
			'contentBgEnabled'       => false,
			'contentBgColor'         => '#ffffff',
			'contentBgOpacity'       => 100,
			'contentBgPadding'       => 24,
			'contentBgRadius'        => 8,
			'mobileContentBgEnabled' => null,
			'mobileContentBgColor'   => null,
			'mobileContentBgOpacity' => null,
			'mobileContentBgPadding' => null,
			'mobileContentBgRadius'  => null,
			'contentBgShadowEnabled' => false,
			'contentBgShadowColor'   => '#000000',
			'contentBgShadowOpacity' => 20,
			'contentBgShadowBlur'    => 24,
			'contentBgShadowY'       => 10,
			'mobileContentBgShadowEnabled' => null,
			'mobileContentBgShadowColor'   => null,
			'mobileContentBgShadowOpacity' => null,
			'mobileContentBgShadowBlur'    => null,
			'mobileContentBgShadowY'       => null,
			'desktopHeight'          => 490,
			'mobileHeight'           => 620,
			'autoplay'               => 5200,
			'pauseHover'             => true,
		);
	}

	private static function hex_rgb( $hex ) {
		$hex = ltrim( (string) $hex, '#' );
		if ( 3 === strlen( $hex ) ) {
			$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
		}
		if ( 6 !== strlen( $hex ) ) {
			$hex = '000000';
		}
		return implode( ',', array( hexdec( substr( $hex, 0, 2 ) ), hexdec( substr( $hex, 2, 2 ) ), hexdec( substr( $hex, 4, 2 ) ) ) );
	}

	private static function gradient_stops_css( $stops ) {
		usort( $stops, function ( $a, $b ) {
			return $a['pos'] <=> $b['pos'];
		} );
		$parts = array();
		foreach ( $stops as $s ) {
			$parts[] = 'rgba(' . self::hex_rgb( $s['color'] ) . ',' . number_format( (float) $s['opacity'], 2 ) . ') ' . (int) $s['pos'] . '%';
		}
		return implode( ', ', $parts );
	}

	private static function gradient_css( $g ) {
		if ( empty( $g ) || 'off' === $g['type'] ) {
			return 'transparent';
		}
		$stops = self::gradient_stops_css( $g['stops'] );
		if ( 'radial' === $g['type'] ) {
			return 'radial-gradient(circle at ' . (int) $g['radialX'] . '% ' . (int) $g['radialY'] . '%, ' . $stops . ')';
		}
		return 'linear-gradient(' . (int) $g['angle'] . 'deg, ' . $stops . ')';
	}

	/**
	 * Renders one banner (post ID) as a self-contained <section>. Multiple
	 * banners can appear on the same page — everything is scoped with an
	 * instance suffix, and the shared CSS/JS is enqueued once, not per-instance.
	 */
	public static function render( $post_id ) {
		$slides_raw = JCS_CPT::get_data( $post_id );
		if ( empty( $slides_raw ) || ! is_array( $slides_raw ) ) {
			return '';
		}

		wp_enqueue_style( 'jcs-frontend', JCS_PLUGIN_URL . 'assets/frontend.css', array(), JCS_VERSION );
		$font_url = '';
		if ( class_exists( 'JCS_Settings' ) ) {
			$used_fonts = JCS_Settings::font_list();
			foreach ( $slides_raw as $font_slide ) {
				foreach ( array( 'headingFont','bodyFont','eyebrowFont','buttonFont' ) as $font_key ) {
					if ( ! empty( $font_slide[ $font_key ] ) ) $used_fonts[] = $font_slide[ $font_key ];
				}
			}
			$font_url = JCS_Settings::google_fonts_url( array_values( array_unique( $used_fonts ) ) );
		}
		if ( $font_url ) wp_enqueue_style( 'jcs-fonts', $font_url, array(), null );
		wp_enqueue_script( 'jcs-frontend', JCS_PLUGIN_URL . 'assets/frontend.js', array(), JCS_VERSION, true );

		$instance = 'jcs-' . (int) $post_id;
		$slides   = array();
		foreach ( $slides_raw as $slide ) {
			$slides[] = wp_parse_args( $slide, self::defaults() );
		}

		$s0 = $slides[0];

		$slides_html = array();
		foreach ( $slides as $i => $s ) {
			$slides_html[] = self::render_slide( $s, $i );
		}

		$out  = '<section class="csx-banner-root' . ( count( $slides ) <= 1 ? ' csx-single-slide' : '' ) . '" ';
		$out .= 'id="' . esc_attr( $instance ) . '" ';
		$out .= 'data-autoplay="' . (int) $s0['autoplay'] . '" ';
		$out .= 'data-pause-hover="' . ( $s0['pauseHover'] ? '1' : '0' ) . '" ';
		$out .= 'style="--jcs-desktop-height:' . (int) $s0['desktopHeight'] . 'px;--jcs-mobile-height:' . (int) $s0['mobileHeight'] . 'px;" ';
		$out .= 'aria-roledescription="carousel" aria-label="' . esc_attr__( 'Featured', 'jcs' ) . '">';
		$out .= '<div class="csx-track">' . implode( '', $slides_html ) . '</div>';
		$out .= '<span class="csx-arrow csx-prev" role="button" tabindex="0" aria-label="' . esc_attr__( 'Previous slide', 'jcs' ) . '" ';
		$out .= 'style="background:rgba(' . self::hex_rgb( $s0['arrowBg'] ) . ',' . ( $s0['arrowBgOpacity'] / 100 ) . ');border-color:rgba(' . self::hex_rgb( $s0['arrowBorderColor'] ) . ',' . ( $s0['arrowBorderOpacity'] / 100 ) . ');color:' . esc_attr( $s0['arrowIconColor'] ) . ';">&#8249;</span>';
		$out .= '<span class="csx-arrow csx-next" role="button" tabindex="0" aria-label="' . esc_attr__( 'Next slide', 'jcs' ) . '" ';
		$out .= 'style="background:rgba(' . self::hex_rgb( $s0['arrowBg'] ) . ',' . ( $s0['arrowBgOpacity'] / 100 ) . ');border-color:rgba(' . self::hex_rgb( $s0['arrowBorderColor'] ) . ',' . ( $s0['arrowBorderOpacity'] / 100 ) . ');color:' . esc_attr( $s0['arrowIconColor'] ) . ';">&#8250;</span>';
		$out .= '<div class="csx-dash-track" data-dash-color="' . esc_attr( $s0['dashColor'] ) . '"></div>';
		$out .= '</section>';

		return $out;
	}

	private static function render_slide( $s, $i ) {
		$g  = $s['gradient'];
		$mg = ! empty( $s['mobileGradient'] ) ? $s['mobileGradient'] : $g;

		$justify_of = function ( $side ) {
			return 'right' === $side ? 'flex-end' : ( 'center' === $side ? 'center' : 'flex-start' );
		};
		$align_of = function ( $side ) {
			return 'right' === $side ? 'right' : ( 'center' === $side ? 'center' : 'left' );
		};

		$m_side          = null !== $s['mobileContentSide'] ? $s['mobileContentSide'] : $s['contentSide'];
		$m_align         = null !== $s['mobileContentAlign'] ? $s['mobileContentAlign'] : $s['contentAlign'];
		$m_pad           = null !== $s['mobileContentPadding'] ? $s['mobileContentPadding'] : $s['contentPadding'];
		$m_gap_eyebrow   = null !== $s['mobileGapEyebrow'] ? $s['mobileGapEyebrow'] : $s['gapEyebrow'];
		$m_gap_heading   = null !== $s['mobileGapHeading'] ? $s['mobileGapHeading'] : $s['gapHeading'];
		$m_gap_sub       = null !== $s['mobileGapSub'] ? $s['mobileGapSub'] : $s['gapSub'];
		$m_eyebrow_size = null !== $s['mobileEyebrowSize'] ? $s['mobileEyebrowSize'] : $s['eyebrowSize'];
		$m_heading_size  = null !== $s['mobileHeadingSize'] ? $s['mobileHeadingSize'] : round( $s['headingSize'] * 0.74 );
		$m_sub_size      = null !== $s['mobileSubSize'] ? $s['mobileSubSize'] : $s['subSize'];
		$m_button_size   = null !== $s['mobileButtonFontSize'] ? $s['mobileButtonFontSize'] : $s['buttonFontSize'];
		$m_eyebrow_letter = null !== $s['mobileEyebrowLetterSpacing'] ? $s['mobileEyebrowLetterSpacing'] : $s['eyebrowLetterSpacing'];
		$m_heading_letter = null !== $s['mobileHeadingLetterSpacing'] ? $s['mobileHeadingLetterSpacing'] : $s['headingLetterSpacing'];
		$m_sub_letter = null !== $s['mobileSubLetterSpacing'] ? $s['mobileSubLetterSpacing'] : $s['subLetterSpacing'];
		$m_button_letter = null !== $s['mobileButtonLetterSpacing'] ? $s['mobileButtonLetterSpacing'] : $s['buttonLetterSpacing'];
		$m_content_width = null !== $s['mobileContentWidth'] ? $s['mobileContentWidth'] : $s['contentWidth'];

		$content_bg_d = $s['contentBgEnabled'] ? 'rgba(' . self::hex_rgb( $s['contentBgColor'] ) . ',' . ( $s['contentBgOpacity'] / 100 ) . ')' : 'transparent';
		$pad_d        = $s['contentBgEnabled'] ? (int) $s['contentBgPadding'] : 0;
		$rad_d        = $s['contentBgEnabled'] ? (int) $s['contentBgRadius'] : 0;
		$shadow_d     = $s['contentBgShadowEnabled'] ? ( '0 ' . (int) $s['contentBgShadowY'] . 'px ' . (int) $s['contentBgShadowBlur'] . 'px rgba(' . self::hex_rgb( $s['contentBgShadowColor'] ) . ',' . ( $s['contentBgShadowOpacity'] / 100 ) . ')' ) : 'none';

		$m_bg_enabled = null !== $s['mobileContentBgEnabled'] ? $s['mobileContentBgEnabled'] : $s['contentBgEnabled'];
		$m_bg_color   = null !== $s['mobileContentBgColor'] ? $s['mobileContentBgColor'] : $s['contentBgColor'];
		$m_bg_opacity = null !== $s['mobileContentBgOpacity'] ? $s['mobileContentBgOpacity'] : $s['contentBgOpacity'];
		$m_bg_padding = null !== $s['mobileContentBgPadding'] ? $s['mobileContentBgPadding'] : $s['contentBgPadding'];
		$m_bg_radius  = null !== $s['mobileContentBgRadius'] ? $s['mobileContentBgRadius'] : $s['contentBgRadius'];
		$m_shadow_on  = null !== $s['mobileContentBgShadowEnabled'] ? $s['mobileContentBgShadowEnabled'] : $s['contentBgShadowEnabled'];
		$m_shadow_col = null !== $s['mobileContentBgShadowColor'] ? $s['mobileContentBgShadowColor'] : $s['contentBgShadowColor'];
		$m_shadow_op  = null !== $s['mobileContentBgShadowOpacity'] ? $s['mobileContentBgShadowOpacity'] : $s['contentBgShadowOpacity'];
		$m_shadow_bl  = null !== $s['mobileContentBgShadowBlur'] ? $s['mobileContentBgShadowBlur'] : $s['contentBgShadowBlur'];
		$m_shadow_y   = null !== $s['mobileContentBgShadowY'] ? $s['mobileContentBgShadowY'] : $s['contentBgShadowY'];
		$content_bg_m = $m_bg_enabled ? 'rgba(' . self::hex_rgb( $m_bg_color ) . ',' . ( $m_bg_opacity / 100 ) . ')' : 'transparent';
		$pad_m        = $m_bg_enabled ? (int) $m_bg_padding : 0;
		$rad_m        = $m_bg_enabled ? (int) $m_bg_radius : 0;
		$shadow_m     = $m_shadow_on ? ( '0 ' . (int) $m_shadow_y . 'px ' . (int) $m_shadow_bl . 'px rgba(' . self::hex_rgb( $m_shadow_col ) . ',' . ( $m_shadow_op / 100 ) . ')' ) : 'none';

		$eyebrow_bg_enabled = ! array_key_exists( 'eyebrowBgEnabled', $s ) || ! empty( $s['eyebrowBgEnabled'] );
		$button_bg_enabled  = ! array_key_exists( 'buttonBgEnabled', $s ) || ! empty( $s['buttonBgEnabled'] );
		$eyebrow_background = $eyebrow_bg_enabled ? ( 'rgba(' . self::hex_rgb( $s['eyebrowBg'] ) . ',' . ( $s['eyebrowOpacity'] / 100 ) . ')' ) : 'transparent';
		$button_background  = $button_bg_enabled ? ( 'rgba(' . self::hex_rgb( $s['buttonBg'] ) . ',' . ( $s['buttonOpacity'] / 100 ) . ')' ) : 'transparent';

		$eyebrow_shadow = $s['eyebrowShadowEnabled'] ? ( '0 ' . (int) $s['eyebrowShadowY'] . 'px ' . (int) $s['eyebrowShadowBlur'] . 'px rgba(' . self::hex_rgb( $s['eyebrowShadowColor'] ) . ',' . ( $s['eyebrowShadowOpacity'] / 100 ) . ')' ) : 'none';
		$button_shadow  = $s['buttonShadowEnabled'] ? ( '0 ' . (int) $s['buttonShadowY'] . 'px ' . (int) $s['buttonShadowBlur'] . 'px rgba(' . self::hex_rgb( $s['buttonShadowColor'] ) . ',' . ( $s['buttonShadowOpacity'] / 100 ) . ')' ) : 'none';

		$is_fixed      = 'fixed' === $s['desktopAttachment'];
		$desk_size = 'width' === $s['desktopFit'] ? '100% auto' : ( 'contain' === $s['desktopFit'] ? 'contain' : ( 'custom' === $s['desktopFit'] ? ( (int) $s['desktopZoom'] . '% auto' ) : 'cover' ) );
		$picture_style = 'background-image:url(\'' . esc_url( $s['desktopImage'] ) . '\');background-size:' . $desk_size . ';background-position:' . (int) $s['desktopX'] . '% ' . (int) $s['desktopY'] . '%;background-attachment:' . ( $is_fixed ? 'fixed' : 'scroll' ) . ';background-repeat:no-repeat;--jcs-mobile-bg:url(\'' . esc_url( $s['mobileImage'] ? $s['mobileImage'] : $s['desktopImage'] ) . '\');--jcs-mobile-bg-size:' . (int) $s['mobileWidth'] . '% auto;--jcs-mobile-bg-pos:' . (int) $s['mobileX'] . '% ' . (int) $s['mobileY'] . '%;';

		$overlay_css = '';
		if ( 'color' === $s['overlayType'] ) {
			$overlay_css = 'display:block;opacity:' . ( $s['overlayOpacity'] / 100 ) . ';mix-blend-mode:' . esc_attr( $s['overlayBlendMode'] ) . ';background-color:' . esc_attr( $s['overlayColor'] ) . ';';
		} elseif ( 'image' === $s['overlayType'] && ! empty( $s['overlayImage'] ) ) {
			$overlay_css = 'display:block;opacity:' . ( $s['overlayOpacity'] / 100 ) . ';mix-blend-mode:' . esc_attr( $s['overlayBlendMode'] ) . ';background-image:url(\'' . esc_url( $s['overlayImage'] ) . '\');background-size:cover;background-position:center;background-repeat:no-repeat;';
		}

		$hover_style = '';
		if ( $s['buttonHoverEnabled'] ) {
			$hover_style = '<style>[data-slide-key="' . esc_attr( $i ) . '-' . md5( $s['buttonText'] . $i ) . '"] .csx-button:hover{background:' . esc_attr( $button_bg_enabled ? $s['buttonHoverBg'] : 'transparent' ) . '!important;color:' . esc_attr( $s['buttonHoverColor'] ) . '!important;}</style>';
		}

		$heading_html = nl2br( esc_html( $s['heading'] ) );

		$html  = '<article class="csx-slide' . ( 0 === $i ? ' is-active' : '' ) . '" data-slide="' . (int) $i . '" data-slide-key="' . esc_attr( $i . '-' . md5( $s['buttonText'] . $i ) ) . '" style="background-color:' . esc_attr( $s['bgColor'] ? $s['bgColor'] : '#0a0a0a' ) . ';">';
		$html .= $hover_style;
		$html .= '<div class="csx-bg" data-attachment="' . ( $is_fixed ? 'fixed' : 'scroll' ) . '" style="' . esc_attr( $picture_style ) . '"></div>';
		if ( ! empty( $s['desktopBgLink'] ) ) $html .= '<a class="csx-bg-link csx-bg-link-desktop" href="' . esc_url( $s['desktopBgLink'] ) . '"' . ( ! empty( $s['desktopBgNewTab'] ) ? ' target="_blank" rel="noopener noreferrer"' : '' ) . ' aria-label="' . esc_attr( $s['altText'] ? $s['altText'] : 'Open banner link' ) . '"></a>';
		if ( ! empty( $s['mobileBgLink'] ) ) $html .= '<a class="csx-bg-link csx-bg-link-mobile" href="' . esc_url( $s['mobileBgLink'] ) . '"' . ( ! empty( $s['mobileBgNewTab'] ) ? ' target="_blank" rel="noopener noreferrer"' : '' ) . ' aria-label="' . esc_attr( $s['altText'] ? $s['altText'] : 'Open banner link' ) . '"></a>';
		$html .= '<div class="csx-overlay" style="' . esc_attr( $overlay_css ) . '"></div>';
		$html .= '<div class="csx-scrim" style="--jcs-scrim-d:' . self::gradient_css( $g ) . ';--jcs-scrim-m:' . self::gradient_css( $mg ) . ';background:var(--jcs-scrim-d);"></div>';
		$html .= '<div class="csx-inner" style="justify-content:' . $justify_of( $s['contentSide'] ) . ';align-items:' . esc_attr( $s['contentAlign'] ) . ';padding-left:' . (int) $s['contentPadding'] . 'px;padding-right:' . (int) $s['contentPadding'] . 'px;--jcs-m-justify:' . $justify_of( $m_side ) . ';--jcs-m-align:' . esc_attr( $m_align ) . ';--jcs-m-pad:' . (int) $m_pad . 'px;">';
		$html .= '<div class="csx-content" style="display:' . ( empty( $s['showContent'] ) ? 'none' : 'block' ) . ';--jcs-mobile-display:' . ( empty( $s['mobileShowContent'] ) ? 'none' : 'block' ) . ';width:min(' . (int) $s['contentWidth'] . 'px,98%);text-align:' . esc_attr( $s['textAlign'] ? $s['textAlign'] : $align_of( $s['contentSide'] ) ) . ';transform:translate(' . (int) $s['contentShiftX'] . 'px,' . (int) $s['contentShiftY'] . 'px);background:' . $content_bg_d . ';padding:' . $pad_d . 'px;border-radius:' . $rad_d . 'px;box-shadow:' . $shadow_d . ';--jcs-m-text-align:' . esc_attr( $s['mobileTextAlign'] ? $s['mobileTextAlign'] : $align_of( $m_side ) ) . ';--jcs-m-shiftx:' . (int) $s['mobileContentShiftX'] . 'px;--jcs-m-shifty:' . (int) $s['mobileContentShiftY'] . 'px;--jcs-m-width:' . (int) $m_content_width . 'px;--jcs-m-content-bg:' . $content_bg_m . ';--jcs-m-content-pad:' . $pad_m . 'px;--jcs-m-content-radius:' . $rad_m . 'px;--jcs-m-content-shadow:' . $shadow_m . ';">';
		if ( $s['eyebrow'] ) {
			$html .= '<span class="csx-eyebrow" style="background:' . esc_attr( $eyebrow_background ) . ';color:' . esc_attr( $s['eyebrowColor'] ) . ';padding:' . (int) $s['eyebrowPadY'] . 'px ' . (int) $s['eyebrowPadX'] . 'px;border-radius:' . (int) $s['eyebrowRadius'] . 'px;font-family:' . esc_attr( $s['eyebrowFont'] ) . ',sans-serif;font-weight:' . (int) $s['eyebrowWeight'] . ';font-size:' . (int) $s['eyebrowSize'] . 'px;letter-spacing:' . esc_attr( $s['eyebrowLetterSpacing'] ) . 'px;transform:translate(' . (int) $s['eyebrowShiftX'] . 'px,' . (int) $s['eyebrowShiftY'] . 'px);--jcs-m-size:' . (int) $m_eyebrow_size . 'px;--jcs-m-letter:' . esc_attr( $m_eyebrow_letter ) . 'px;--jcs-m-shiftx:' . (int) $s['mobileEyebrowShiftX'] . 'px;--jcs-m-shifty:' . (int) $s['mobileEyebrowShiftY'] . 'px;box-shadow:' . $eyebrow_shadow . ';margin-bottom:' . (int) $s['gapEyebrow'] . 'px;--jcs-m-gap:' . (int) $m_gap_eyebrow . 'px;">' . esc_html( $s['eyebrow'] ) . '</span>';
		}
		if ( $s['heading'] ) {
			$html .= '<div role="heading" aria-level="2" class="csx-heading" style="color:' . esc_attr( $s['headingColor'] ) . ';font-family:' . esc_attr( $s['headingFont'] ) . ',sans-serif;font-weight:' . (int) $s['headingWeight'] . ';font-size:' . (int) $s['headingSize'] . 'px;letter-spacing:' . esc_attr( $s['headingLetterSpacing'] ) . 'px;transform:translate(' . (int) $s['headingShiftX'] . 'px,' . (int) $s['headingShiftY'] . 'px);--jcs-m-letter:' . esc_attr( $m_heading_letter ) . 'px;--jcs-m-shiftx:' . (int) $s['mobileHeadingShiftX'] . 'px;--jcs-m-shifty:' . (int) $s['mobileHeadingShiftY'] . 'px;line-height:' . esc_attr( $s['headingLineHeight'] ) . ';margin-bottom:' . (int) $s['gapHeading'] . 'px;--jcs-m-gap:' . (int) $m_gap_heading . 'px;--jcs-m-size:' . (int) $m_heading_size . 'px;">' . $heading_html . '</div>';
		}
		if ( $s['subheading'] ) {
			$html .= '<div class="csx-sub" style="color:' . esc_attr( $s['subColor'] ) . ';font-family:' . esc_attr( $s['bodyFont'] ) . ',sans-serif;font-weight:' . (int) $s['bodyWeight'] . ';font-size:' . (int) $s['subSize'] . 'px;letter-spacing:' . esc_attr( $s['subLetterSpacing'] ) . 'px;transform:translate(' . (int) $s['subShiftX'] . 'px,' . (int) $s['subShiftY'] . 'px);--jcs-m-letter:' . esc_attr( $m_sub_letter ) . 'px;--jcs-m-shiftx:' . (int) $s['mobileSubShiftX'] . 'px;--jcs-m-shifty:' . (int) $s['mobileSubShiftY'] . 'px;line-height:' . esc_attr( $s['subLineHeight'] ) . ';margin-bottom:' . (int) $s['gapSub'] . 'px;--jcs-m-gap:' . (int) $m_gap_sub . 'px;--jcs-m-size:' . (int) $m_sub_size . 'px;">' . esc_html( $s['subheading'] ) . '</div>';
		}
		if ( $s['buttonText'] ) {
			$html .= '<a href="' . esc_url( $s['buttonUrl'] ) . '"' . ( ! empty( $s['buttonNewTab'] ) ? ' target="_blank" rel="noopener noreferrer"' : '' ) . ' class="csx-button" style="background:' . esc_attr( $button_background ) . ';color:' . esc_attr( $s['buttonColor'] ) . ';padding:0 ' . (int) $s['buttonPadX'] . 'px;min-height:' . (int) $s['buttonHeight'] . 'px;border-radius:' . (int) $s['buttonRadius'] . 'px;font-family:' . esc_attr( $s['buttonFont'] ) . ',sans-serif;font-weight:' . (int) $s['buttonWeight'] . ';font-size:' . (int) $s['buttonFontSize'] . 'px;letter-spacing:' . esc_attr( $s['buttonLetterSpacing'] ) . 'px;transform:translate(' . (int) $s['buttonShiftX'] . 'px,' . (int) $s['buttonShiftY'] . 'px);width:' . ( (int) $s['buttonWidth'] > 0 ? (int) $s['buttonWidth'] . 'px' : 'auto' ) . ';--jcs-m-size:' . (int) $m_button_size . 'px;--jcs-m-letter:' . esc_attr( $m_button_letter ) . 'px;--jcs-m-shiftx:' . (int) $s['mobileButtonShiftX'] . 'px;--jcs-m-shifty:' . (int) $s['mobileButtonShiftY'] . 'px;--jcs-m-width:' . ( (int) $s['mobileButtonWidth'] > 0 ? (int) $s['mobileButtonWidth'] . 'px' : 'auto' ) . ';box-shadow:' . $button_shadow . ';transition:background .15s ease, color .15s ease;">' . esc_html( $s['buttonText'] ) . '</a>';
		}
		$html .= '</div></div></article>';

		return $html;
	}
}
