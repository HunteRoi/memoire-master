import { FC } from 'react';
import { useNavigate } from 'react-router';

import { useAppContext } from '../hooks/useAppContext';
import { useEnsureData } from '../hooks/useEnsureData';

export const VisualProgramming: FC = () => {
    const navigate = useNavigate();
    const {} = useAppContext();

    useEnsureData();


    return <>
        Programming
    </>;
};
