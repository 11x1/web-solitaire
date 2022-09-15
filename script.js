/*
    TODO: //
    //  fix card invalid stacking
    //  fix selecting row on hover and only do it on click
    //  if cards match, dont hide the card below and apply the small-text class to its child[0]
    //  if clicking on a card that has cards above it, move the whole stack
    //  do ace rows
    //  fix card offset step

    [ 15.09 ]
    //  fix card pack selection and style
    //  fix card selecting from discard-pack
    //  only let kings be moved to empty rows
    //  do card pack
    //* irritaing upper row items not aligning with table items
    //* card text overflow when in discard pack ( mb fixable when setting the cards under the top one class to small-text?)
    //* game start/end
*/

const colors = {
    'green': 'rgb( 100, 255, 100 )'
}

const log_debug = ( reason, text, accent ) => {
    console.log( `%c[%c${ reason }%c]%c ${ text }`, 
    'color: white',
    `color: ${ accent }`, 
    'color: white',
    'color: gray' )
}

class vec2_t {
    constructor( x, y ) {
        this.x = x;
        this.y = y;
    }

    set = ( x, y ) => {
        this.x = x;
        this.y = y;
    }

    get get( ) {
        return new vec2_t( this.x, this.y );
    }

    
}

const card_order = [
    'K',
    'Q',
    'J',
    '10',
    '9',
    '8',
    '7',
    '6',
    '5',
    '4',
    '3',
    '2',
    'A'
];

const card_characters = {
    '♥': [ '♣', '♠' ],
    '♦': [ '♣', '♠' ],
    '♣': [ '♥', '♦' ],
    '♠': [ '♥', '♦' ],
}

const fits_to_row = ( this_number, this_character, row_number, row_character ) => {
    let this_index = card_order.findIndex( ( element ) => element === this_number )
    let row_index = card_order.findIndex( ( element ) => element === row_number )

    return ( this_index - row_index == 1 ) && card_characters[ this_character ].includes( row_character )
}

const fits_to_ace = ( this_number, this_character, ace_number, ace_character ) => {
    let this_index = card_order.findIndex( ( element ) => element === this_number )
    let row_index = card_order.findIndex( ( element ) => element === ace_number )

    return ( row_index - this_index == 1 ) && !card_characters[ this_character ].includes( ace_character )
}

const is_in_bounds = ( pos, start, size ) => pos.x > start.x && pos.x < start.x + size.x && pos.y > start.y && pos.y < start.y + size.y

const update_card_offsets_in_row = ( row ) => {
    let step = row.parentElement.offsetHeight / 30

    for ( i = 1; i < row.children.length; i++ ) {
        row.children[ i ].style.marginTop = ( i - 1 ) * step + 'px'
    }
}

const mouse_data = {
    pos: new vec2_t( 0, 0 ),
    held: false
};

const dragging_data = {
    element: null,
    elements: [ ],
    element_cache: null,
    parent: null,

    selected_parent: null,
    hovering_discard_pack: false,
}

const remaining_pack = document.getElementById( 'card-pack' )
let remaining_pack_data= remaining_pack.getBoundingClientRect( )
let remaining_pack_bounds = { 
    pos: new vec2_t( remaining_pack_data.x, remaining_pack_data.y ),
    size: new vec2_t( remaining_pack_data.width, remaining_pack_data.height )
}

const update_remaining_pack_bounds = ( ) => {
    let remaining_pack_data= remaining_pack.getBoundingClientRect( )
    remaining_pack_bounds.pos.set( remaining_pack_data.x, remaining_pack_data.y )
    remaining_pack_bounds.size.set( remaining_pack_data.width, remaining_pack_data.height ) 
}

const discard_pack = document.getElementById( 'discard-pack' )
let discard_pack_bounds = { pos: new vec2_t( 0, 0 ), size: new vec2_t( 0, 0 ) }
const update_discard_pack_bounds = ( ) => {
    let data = discard_pack.getBoundingClientRect( )
    discard_pack_bounds.pos.set( data.x, data.y )
    discard_pack_bounds.size.set( data.width, data.height )
}
update_discard_pack_bounds( )

const full_pack = [ ];

Object.entries( card_characters ).forEach( ( [ character, _] ) => {
    for ( let i = 0; i < card_order.length; i++ ) {
        let letter = card_order[ i ]

        full_pack.push( letter + character )
    }
} )

const test_setup_pack = ( ) => {
    for ( let entry of full_pack ) {
        const card = document.createElement( 'div' )

        const characters = entry.split( '' )
        const character = characters[ characters.length - 1 ]
        const color_class = character == '♠' || character == '♣' ? 'black-text' : 'red-text'

        card.className = 'draggable-card ' + color_class + ' back' 

        const text_node = document.createElement( 'p' )
        text_node.innerText = entry
        text_node.className = 'card-text'

        card.appendChild( text_node )
        remaining_pack.appendChild( card )
    }
}

test_setup_pack( )


let cards = document.getElementsByClassName( 'draggable-card' )
for ( let card of cards ) {
    card.addEventListener( 'mousedown', ( e ) => {
        if ( dragging_data.elements.includes( card ) ) {
            log_debug( 'event', 'put card', 'yellow' )

            if ( dragging_data.selected_parent !== null ) {
                for ( let card of dragging_data.elements ) {
                    dragging_data.selected_parent.appendChild( card )
                    card.style = dragging_data.cached_data
                }
            } else {
                for ( let card of dragging_data.elements ) {
                    dragging_data.parent.appendChild( card )
                    card.style = dragging_data.cached_data
                }
            }

            if ( !card.parentElement.classList.contains( 'card-pack' ) ) {
                update_card_offsets_in_row( card.parentElement );
            }

            back_from_classes( rows );
            log_debug( 'update', 'card faces', colors.green );

            dragging_data.element = null;
            dragging_data.parent = null;
            dragging_data.elements = [ ];
            return
        
        }
        if ( card.classList.contains( 'back' ) ) return;

        // cache data
        dragging_data.parent = card.parentElement
        dragging_data.element_cache = 'position: relative; left: 0; right: 0';
    
        // find the index of our card in the parent
        let index = Array.from( card.parentElement.children ).indexOf( card );
        
        let elements = [ ];
        for ( let i = index; i < card.parentElement.children.length; i++ ) {
            elements.push( card.parentElement.children[ i ] )
        }

        if ( dragging_data.hovering_discard_pack ) {
            console.log( discard_pack.children[ discard_pack.children.length - 1 ].children[ 0 ].innerText )
            elements = [ discard_pack.children[ discard_pack.children.length - 1 ] ];
            elements[ 0 ] = elements[ 0 ];
            log_debug( 'event', 'selected from discard pack', 'yellow' )
        }

        dragging_data.element = elements[ 0 ];

        dragging_data.elements = elements;

        let data = dragging_data.element.getBoundingClientRect( );
        let [ x, y, w, h ] = [ data.x, data.y, data.width, data.height ];

        dragging_data.difference = new vec2_t( mouse_data.pos.x - x, mouse_data.pos.y - y );

        let start = new vec2_t( 
            mouse_data.pos.x - dragging_data.difference.x,
            mouse_data.pos.y - dragging_data.difference.y + 15
        )

        for ( let i = 0; i < elements.length; i++ ) {
            let card = elements[ i ];
            card.style.position = 'fixed';
            card.style.marginTop = '0';
            card.style.marginLeft = '0';

            let offset_y = ( i - 1 ) * 10; 

            card.style.left = start.x + 'px';
            card.style.top = start.y + offset_y + 'px';

            document.body.appendChild( card )
        }
        
        log_debug( 'update', `selected card to drag (${ elements[ 0 ].children[ 0 ].innerText })`, colors.green )
    } )
}

const row_bounding_boxes = [ ];
const rows = document.getElementsByClassName( 'card-row' )

for ( let row of rows ) {
    let bounds = row.getBoundingClientRect( )
    update_card_offsets_in_row( row )
    row_bounding_boxes.push( { 
        pos: new vec2_t( bounds.x, bounds.y ), 
        size: new vec2_t( bounds.width, bounds.height ),
        element: row
    } )
}

const update_rows = ( rows ) => {
    for ( i = 0; i < rows.length; i++ ) {
        const fresh_data = rows[ i ].getBoundingClientRect( )
        const cached_data = row_bounding_boxes[ i ]

        cached_data.pos.set( fresh_data.x, fresh_data.y )
        cached_data.size.set( fresh_data.width, fresh_data.height )
    }
}

const ace_placeholders = document.getElementsByClassName( 'ace-placeholder' )
const ace_bounds = { };

// set up ace placeholder bounds
for ( let ace of ace_placeholders ) {
    let ace_placeholder_character = ace.children[ 0 ].innerText
    let bounds = ace.getBoundingClientRect( )
    ace_bounds[ ace_placeholder_character ] = {
        pos: new vec2_t( bounds.x, bounds.y ),
        size: new vec2_t( bounds.width, bounds.height ),
        element: ace
    }
}

const update_ace_bounds = ( ) => {
    for ( let ace of ace_placeholders ) {
        let ace_placeholder_character = ace.children[ 0 ].innerText
        let bounds = ace.getBoundingClientRect( )
        ace_bounds[ ace_placeholder_character ].pos.set( bounds.x, bounds.y )
        ace_bounds[ ace_placeholder_character ].size.set( bounds.width, bounds.height )
    }
}

const back_from_classes = ( rows ) => {
    for ( let row of rows ) {
        let children = row.children
        for ( let i = 1; i < children.length; i++ ) {
            let child = children[ i ]
            if ( i == children.length - 1 ) {
                child.classList.remove( 'back' )
                child.children[ 0 ].classList.remove( 'small-text' )
                child.classList.add( 'front' )
            } else {
                let next_card = children[ i + 1 ]
                if ( child.classList.contains( 'front' ) && next_card !== undefined ) {
                    let next_card_data = next_card.children[ 0 ].innerText.split( '' )
                    let this_card_data = child.children[ 0 ].innerText.split( '' )

                    let should_be_small_text = fits_to_row( next_card_data[ 0 ], next_card_data[ 1 ], this_card_data[ 0 ], this_card_data[ 1 ] )
                    if ( should_be_small_text ) {
                        child.children[ 0 ].classList.add( 'small-text' )
                    }
                } else {
                    child.classList.remove( 'front' )
                    child.classList.add( 'back' )
                }

            }
        }
    }
}

back_from_classes( rows )


document.addEventListener( 'mousedown', ( e ) => {
    mouse_data.held = true

    let in_remaining_pack_bounds = is_in_bounds( mouse_data.pos, remaining_pack_bounds.pos, remaining_pack_bounds.size )
    
    if ( in_remaining_pack_bounds ) {
        if ( remaining_pack.children.length === 1 ) {
            console.log( 'fuck them hoes' )
            const discard_pack_cards = discard_pack.children
    
            for ( let i = discard_pack_cards.length - 1; i > 0; i-- ) {
                discard_pack_cards[ i ].classList.remove( 'front' )
                discard_pack_cards[ i ].classList.add( 'back' )
                remaining_pack.appendChild( discard_pack_cards[ i ] )
            }
        } else {
            let topmost_child = remaining_pack.children[ remaining_pack.children.length - 1 ]
            if ( topmost_child !== undefined ) {
                discard_pack.appendChild( topmost_child )
                topmost_child.classList.remove( 'back' )
                topmost_child.classList.add( 'front' )
            }
        }
    }

    for ( let row of rows ) {
        let children = row.children
        for ( let i = 1; i < children.length - 1; i++ ) {
            let child = children[ i ]

            if ( !child.children[ 0 ].classList.contains( 'small-text' ) ) {
                child.children[ 0 ].classList.add( 'small-text' )
            }
        }
    }

    update_discard_pack_bounds( )
} )

document.addEventListener( 'mouseup', ( e ) => {
    mouse_data.held = false

    for ( i = 0; i < row_bounding_boxes.length; i++ ) {
        let row_element = row_bounding_boxes[ i ].element
        
        row_element.children[0].classList.remove( 'highlighted' );
    }
} )

document.addEventListener( 'mousemove', ( e ) => {
    mouse_data.pos.set( e.clientX, e.clientY )
    dragging_data.hovering_discard_pack = is_in_bounds( mouse_data.pos, discard_pack_bounds.pos, discard_pack_bounds.size )

    if ( dragging_data.element === null ) {
        dragging_data.selected_parent = null
        return;
    }

    const element = dragging_data.element
    const parent = dragging_data.parent

    let start = new vec2_t( 
        mouse_data.pos.x - dragging_data.difference.x,
        mouse_data.pos.y - dragging_data.difference.y + 15
    )

    for ( let i = 0; i < dragging_data.elements.length; i++ ) {
        let element = dragging_data.elements[ i ];
        element.style.position = 'fixed';

        let offset_y = ( i - 1 ) * 15;

        element.style.left = start.x + 'px';
        element.style.top = start.y + offset_y + 'px';
    }


    dragging_data.selected_parent = null;

    for ( i = 0; i < row_bounding_boxes.length; i++ ) {
        let row = row_bounding_boxes[ i ]

        let row_element = row.element
        let row_bounds_start = row.pos.get
        let row_bounds_size = row.size.get

        let is_in_row = is_in_bounds( mouse_data.pos, row_bounds_start, row_bounds_size )
        
        if ( !is_in_row  ) {
            row_element.children[0].classList.remove( 'highlighted' );
            continue;
        }

        let empty_row = row_element.children[ 1 ] === undefined

        if ( !empty_row ) {
            let topmost_row_element = row_element.children.item( row_element.children.length - 1 )

            if ( topmost_row_element === null ) {
                row_element.children[0].classList.remove( 'highlighted' );
                continue;
            }

            let card_data = element.children[ 0 ].innerText.split( '' )
            let topmost_data = topmost_row_element.children[ 0 ].innerText.split( '' )

            let fits = fits_to_row(
                card_data.slice( 0, card_data.length - 1 ).join( '' ),
                card_data[ card_data.length - 1 ],
                topmost_data.slice( 0, topmost_data.length - 1 ).join( '' ),
                topmost_data[ topmost_data.length - 1 ]
            )

            if ( !fits ) {
                row_element.children[0].classList.remove( 'highlighted' );
                dragging_data.selected_parent = null;
                continue;
            } else {
                row_element.children[0].classList.add( 'highlighted' )
                dragging_data.selected_parent = row_element
            }
        }
        
        let card_is_king = element.children[ 0 ].innerText.split( '' )[ 0 ] == 'K'

        if ( card_is_king && empty_row ) {
            row_element.children[0].classList.add( 'highlighted' )
            dragging_data.selected_parent = row_element
        }
    }

    if ( dragging_data.elements.length == 1 ) {
        Object.entries( ace_bounds ).forEach( ( [ key, value ] ) => {
            let in_bounds = is_in_bounds( mouse_data.pos, value.pos.get, value.size.get )

            if ( !in_bounds ) {
                value.element.children[ 0 ].classList.remove( 'highlighted' )
            } else {
                let last_element_data = element.children[ 0 ].innerText.split( '' )
                let card_character_same_as_element = last_element_data[ last_element_data.length - 1 ] == key
                let ace_is_ace = element.children[ 0 ].innerText.split( '' )[ 0 ] == 'A'
                // == 1 because we have text node in ace placeholder
                let ace_placeholder_empty = value.element.children.length == 1
    
                if ( ace_placeholder_empty && ace_is_ace && card_character_same_as_element  ) {
                    dragging_data.selected_parent = value.element
    
                    value.element.children[ 0 ].classList.add( 'highlighted' )
                    return
                }
    
                if ( card_character_same_as_element && !ace_placeholder_empty ) {
    
                    let ace_placeholder_topmost = value.element.children[ value.element.children.length - 1 ]
                    let ace_placeholder_topmost_data = ace_placeholder_topmost.children[ 0 ].innerText.split( '' )
                    let card_data = element.children[ 0 ].innerText.split( '' )

                    let fits = fits_to_ace(
                        card_data.slice( 0, card_data.length - 1 ).join( '' ),
                        card_data[ card_data.length - 1 ],
                        ace_placeholder_topmost_data.slice( 0, ace_placeholder_topmost_data.length - 1 ).join( '' ),
                        ace_placeholder_topmost_data[ ace_placeholder_topmost_data.length - 1 ]
                    )    
    
                    if ( fits ) {
                        dragging_data.selected_parent = value.element
                        value.element.children[ 0 ].classList.add( 'highlighted' )
                    }
                }
            }
        } )

    }
} )

window.addEventListener( 'resize', ( e ) => {
    update_rows( rows )

    for ( let row of rows ) { 
        update_card_offsets_in_row( row )
    }

    update_remaining_pack_bounds( )
    update_discard_pack_bounds( )
    update_ace_bounds( )


    log_debug( 'event', 'updated screen dimensions', 'yellow')
} )
