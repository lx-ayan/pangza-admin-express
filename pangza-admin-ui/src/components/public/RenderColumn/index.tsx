import { useSlots } from "vue";

const RenderColumn = (props: { title: string; align?: 'left' | 'right' | 'center'; data?: any;[name: string]: any; }) => {
    const { align = 'left' } = props;

    const alignTextMap = {
        'left': 'text-left',
        'right': 'text-right',
        'center': 'text-center'
    };

    const slots = useSlots();
    return <div >
        <div class={`text-xs text-gray-400 ${alignTextMap[align]} ${props.titleClass}`}>
            {props.title}
        </div>
        <div class={`font-medium mt-1 ${alignTextMap[align]} ${props.dataClass || ''}`}>
            {slots.data ? slots.data() : props.data}
        </div>
    </div>
}

export default RenderColumn;