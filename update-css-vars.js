let root = document.documentElement;

const update = ( ) => {
  root.style.setProperty('--card-width', document.getElementsByClassName( 'playing-window' )[ 0 ].getBoundingClientRect( ).width / 7 + 'px' );
  root.style.setProperty('--card-height', document.getElementsByClassName( 'playing-window' )[ 0 ].getBoundingClientRect( ).width / 6 + 'px' );
}
window.addEventListener("resize", ( _ ) => {
  update( );
});

update( );