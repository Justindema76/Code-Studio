( function ( wp ) {
	var registerBlockType = wp.blocks.registerBlockType;
	var el = wp.element.createElement;
	var useState = wp.element.useState;
	var useEffect = wp.element.useEffect;
	var InspectorControls = wp.blockEditor.InspectorControls;
	var PanelBody = wp.components.PanelBody;
	var SelectControl = wp.components.SelectControl;
	var Button = wp.components.Button;
	var ServerSideRender = wp.serverSideRender || wp.components.ServerSideRender;
	var apiFetch = wp.apiFetch;
	var __ = wp.i18n.__;

	registerBlockType( 'jcs/banner', {
		title: __( 'Banner', 'jcs' ),
		icon: 'images-alt2',
		category: 'media',
		attributes: {
			bannerId: { type: 'number', default: 0 }
		},

		edit: function ( props ) {
			var attributes = props.attributes;
			var setAttributes = props.setAttributes;
			var stateBanners = useState( [] );
			var banners = stateBanners[ 0 ];
			var setBanners = stateBanners[ 1 ];

			useEffect( function () {
				apiFetch( { path: '/jcs/v1/elements' } ).then( function ( list ) {
					setBanners( list || [] );
				} );
			}, [] );

			var options = [ { label: __( '— Select a banner —', 'jcs' ), value: 0 } ].concat(
				banners.map( function ( b ) {
					return { label: b.title + ' (#' + b.id + ')', value: b.id };
				} )
			);

			function createAndEdit() {
				apiFetch( {
					path: '/wp/v2/jcs-elements',
					method: 'POST',
					data: { title: __( 'New Banner', 'jcs' ), status: 'publish' }
				} ).then( function ( post ) {
					window.open( ajaxurl.replace( '/admin-ajax.php', '' ) + '/admin.php?page=jcs-editor&post=' + post.id, '_blank' );
					setAttributes( { bannerId: post.id } );
				} );
			}

			return el(
				wp.element.Fragment,
				{},
				el(
					InspectorControls,
					{},
					el(
						PanelBody,
						{ title: __( 'Banner', 'jcs' ) },
						el( SelectControl, {
							label: __( 'Choose banner', 'jcs' ),
							value: attributes.bannerId,
							options: options,
							onChange: function ( val ) {
								setAttributes( { bannerId: parseInt( val, 10 ) } );
							}
						} ),
						attributes.bannerId
							? el(
									Button,
									{
										variant: 'secondary',
										href: ( window.JCS_ADMIN_URL || '/wp-admin/' ) + 'admin.php?page=jcs-editor&post=' + attributes.bannerId,
										target: '_blank'
									},
									__( 'Edit this banner', 'jcs' )
							  )
							: null,
						el( Button, { variant: 'primary', onClick: createAndEdit, style: { marginTop: '8px' } }, __( 'Create new banner', 'jcs' ) )
					)
				),
				attributes.bannerId
					? el( ServerSideRender, { block: 'jcs/banner', attributes: attributes } )
					: el( 'div', { style: { padding: '40px', textAlign: 'center', background: '#f0f0f0', border: '1px dashed #ccc' } }, __( 'Choose or create a banner in the sidebar →', 'jcs' ) )
			);
		},

		save: function () {
			// Server-rendered — nothing to store client-side.
			return null;
		}
	} );
} )( window.wp );
