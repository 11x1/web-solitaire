/*
    TODO: //
    //  fix card invalid stacking
    //  fix selecting row on hover and only do it on click
    //* if cards match, dont hide the card below
    //* do ace rows
    //* fix card offset step
    //* do card pack
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

const is_in_bounds = ( pos, start, size ) => pos.x > start.x && pos.x < start.x + size.x && pos.y > start.y && pos.y < start.y + size.y

const update_card_offsets_in_row = ( row ) => {
    console.log( row.parentElement.offsetHeight )
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
    element_cache: null,
    parent: null,

    selected_parent: null,
}

const cards = document.getElementsByClassName( 'draggable-card' )
for ( let card of cards ) {
    card.addEventListener( 'mousedown', ( e ) => {
        if ( dragging_data.element == card ) {
            log_debug( 'event', 'put card', 'yellow' )

            if ( dragging_data.selected_parent !== null ) {
                dragging_data.selected_parent.appendChild( card )
            } else {
                dragging_data.parent.appendChild( card )
            }

            card.style = dragging_data.cached_data

            update_card_offsets_in_row( card.parentElement )

            back_from_classes( rows )
            log_debug( 'update', 'card faces', colors.green )

            dragging_data.element = null
            dragging_data.parent = null
            return
        
        }
        if ( card.classList.contains( 'back' ) ) return;

        card.style.position = 'fixed';

        let center = new vec2_t( 
            mouse_data.pos.x - card.offsetWidth / 2,
            mouse_data.pos.y - card.offsetHeight / 2
        )

        card.style.left = center.x + 'px';
        card.style.top = center.y + 'px';

        dragging_data.element = card
        dragging_data.parent = card.parentElement
        dragging_data.element_cache = 'position: relative; left: 0; right: 0';
    
        document.body.appendChild( card )
        log_debug( 'update', 'selected card to drag', colors.green )
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

const back_from_classes = ( rows ) => {
    for ( let row of rows ) {
        let children = row.children
        for ( let i = 1; i < children.length; i++ ) {
            let child = children[ i ]
            if ( i == children.length - 1 ) {
                child.classList.remove( 'back' )
                child.classList.add( 'front' )
            } else {
                child.classList.remove( 'front' )
                child.classList.add( 'back' )
            }
        }
    }
}

back_from_classes( rows )


document.addEventListener( 'mousedown', ( e ) => {
    mouse_data.held = true
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

    if ( dragging_data.element === null ) {
        dragging_data.selected_parent = null
        return;
    }

    const element = dragging_data.element
    const parent = dragging_data.parent
    element.style.position = 'fixed';

    let center = new vec2_t( 
        mouse_data.pos.x - element.offsetWidth / 2,
        mouse_data.pos.y - element.offsetHeight / 2
    )

    element.style.left = center.x + 'px';
    element.style.top = center.y + 'px';

    center.x += element.offsetWidth / 2;
    center.y += element.offsetHeight / 2;

    dragging_data.selected_parent = null;

    for ( i = 0; i < row_bounding_boxes.length; i++ ) {
        let row = row_bounding_boxes[ i ]

        let row_element = row.element
        let start = row.pos.get
        let size = row.size.get

        let is_in_row = is_in_bounds( center, start, size )
        
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
                card_data[ 0 ],
                card_data[ 1 ],
                topmost_data[ 0 ],
                topmost_data[ 1 ]
            )

            if ( !fits ) {
                row_element.children[0].classList.remove( 'highlighted' );
                dragging_data.selected_parent = null;
                continue;
            }
        }
        
        row_element.children[0].classList.add( 'highlighted' )
        dragging_data.selected_parent = row_element
    }

} )

window.addEventListener( 'resize', ( e ) => {
    update_rows( rows )

    for ( let row of rows ) { 
        update_card_offsets_in_row( row )
    }


    log_debug( 'event', 'updated screen dimensions', 'yellow')
} )