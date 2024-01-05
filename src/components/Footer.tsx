import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PaginationItem, Box, Typography, Link } from '@mui/material';

import { TBundleLink } from '../types/partials/BundleLink';
import UserContext from '../context/UserContext';

function Footer({ links, requestId }: { links?: TBundleLink[]; requestId?: String }) {
    const { userDetails } = useContext(UserContext);
    const navigate = useNavigate();

    const location = useLocation();
    const queryParams = new URLSearchParams(location?.search);

    const [username, setUserName] = useState<string | undefined>();
    const [scope, setScope] = useState<string | undefined>();
    // number of pages skipped + 1 is the current page
    const [page, setPage] = useState(parseInt(queryParams.get('_getpagesoffset') || '0') + 1);

    const url: string = location.pathname;
    const hasPrev: boolean = Boolean(page && page > 1);
    const hasNext: boolean = links
        ? links.some((link: TBundleLink) => link.relation === 'next')
        : false;
    const showPagination: boolean = Boolean(url && !url.includes('/_search') && links);

    useEffect(() => {
        setUserName(userDetails?.username);
        setScope(userDetails?.scope);
    }, [userDetails]);

    const handleChange = (newPage: number) => {
        if (newPage > 1) {
            queryParams.set('_getpagesoffset', `${newPage - 1}`);
        } else if (newPage === 1 && queryParams.has('_getpagesoffset')) {
            queryParams.delete('_getpagesoffset');
        }
        if (newPage >= 1) {
            setPage(newPage);
            navigate(location.pathname + (queryParams.size ? '?' + queryParams.toString() : ''));
        }
    };

    return (
        <Box sx={{ p: 1, display: 'flex', borderTop: 1 }}>
            {showPagination && (
                <>
                    <PaginationItem
                        type="previous"
                        shape="circular"
                        size="medium"
                        variant="text"
                        onClick={() => handleChange(page - 1)}
                        disabled={!hasPrev}
                    />
                    <PaginationItem
                        type="page"
                        shape="circular"
                        size="medium"
                        variant="text"
                        page={page}
                        selected={true}
                        disabled={false}
                    />
                    <PaginationItem
                        type="next"
                        shape="circular"
                        size="medium"
                        variant="text"
                        onClick={() => handleChange(page + 1)}
                        disabled={!hasNext}
                    />
                </>
            )}
            {username && (
                <Box sx={{ flexGrow: 1, textAlign: showPagination ? 'end' : 'start' }}>
                    <Typography variant="body2">
                        User: {username}{' '}
                        {requestId ? (
                            <>
                                | RequestId: {requestId}
                                <br />
                            </>
                        ) : (
                            <>| </>
                        )}
                        Scopes: {scope}
                    </Typography>
                </Box>
            )}
            <Box sx={{ flexGrow: 1, textAlign: 'end' }}>
                <Typography variant="body2">
                    &copy; Copyright {new Date().getFullYear()} b.well Connected Health
                    |&nbsp;&nbsp;
                    <Link href="https://docs.google.com/document/d/1afAuyrckHabnCP-uhOqXOQzFUuA4e6yN/edit?usp=sharing&ouid=100180767885483338723&rtpof=true&sd=true">
                        Conditions of Use
                    </Link>
                </Typography>
            </Box>
        </Box>
    );
}

export default Footer;
