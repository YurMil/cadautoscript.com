import { useEffect } from 'react';
import { useSmashBottlesStore } from '../store';

export default function WorldGenerator() {
    const setRiver = useSmashBottlesStore((state) => state.setRiver);
    const setRoadZ = useSmashBottlesStore((state) => state.setRoadZ);
    const resetToken = useSmashBottlesStore((state) => state.resetToken);

    useEffect(() => {
        // Random river
        const hasRiver = Math.random() > 0.5;
        if (hasRiver) {
            const riverWidth = 8 + Math.random() * 8;
            const riverZ = (Math.random() - 0.5) * 20;
            setRiver({ z: riverZ, width: riverWidth, level: -2.5 });
        } else {
            setRiver(null);
        }

        // Random road position
        const roadZ = -35 - Math.random() * 10;
        setRoadZ(roadZ);
    }, [resetToken, setRiver, setRoadZ]);

    return null;
}
