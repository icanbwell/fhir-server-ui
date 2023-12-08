import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {Pagination, PaginationItem, Box, Typography, Link} from '@mui/material';
import EnvironmentContext from '../EnvironmentContext';
import { TBundleLink } from '../types/partials/BundleLink';

function Footer({ links, requestId }: { links?: TBundleLink[], requestId?: String }) {
    const { userDetails } = useContext(EnvironmentContext);
    const navigate = useNavigate();

    const [username, setUserName] = useState<string|undefined>();
    const [scope, setScope] = useState<string|undefined>();
    const [page, setPage] = useState(1);
    const url: string = window.location.pathname;
    const hasPrev: boolean = page > 1;
    const hasNext: boolean = links ? links.some((link: TBundleLink) => link.relation === 'next') : false;

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location?.search);
        // number of pages skipped + 1 is the current page
        setPage(parseInt(queryParams.get('_getpagesoffset') || '0') + 1);
    }, []);

    useEffect(() => {
      setUserName(userDetails?.username);
      setScope(userDetails?.scope);
    }, [userDetails]);

    const handleChange = (_event: React.ChangeEvent<unknown>, newPage: number) => {
        const queryParams = new URLSearchParams(window.location?.search);
        if (newPage > 1) {
            queryParams.set('_getpagesoffset', `${newPage - 1}`);
            setPage(newPage);
        } else if (queryParams.has('_getpagesoffset')) {
            queryParams.delete('_getpagesoffset');
            setPage(1);
        }
        navigate(window.location.pathname + (queryParams.size ? `?${queryParams.toString()}` : ''));
    };

    return (
      <Box sx={{ p: 1, display: 'flex', borderTop: 1 }}>
        {url && !url.includes('/_search') && (
          <>
            <Pagination
              boundaryCount={0}
              count={1}
              onChange={handleChange}
              renderItem={(params) => {
                if (
                  (params.type === 'previous' && hasPrev) ||
                  (params.type === 'next' && hasNext)
                ) {
                  params.disabled = false;
                }
                if (params.type === 'page') {
                  params.page = page;
                }
                return <PaginationItem {...params} />;
              }}
            />
          </>
        )}
        {username && (
          <Box sx={{ flexGrow: 1, pt: 2, textAlign: 'end' }}>
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
        <Box sx={{ flexGrow: 1, pt: 2, textAlign: 'end' }}>
          <Typography variant="body2">
            &copy; Copyright {new Date().getFullYear()} b.well Connected Health |&nbsp;&nbsp;
            <Link href="https://docs.google.com/document/d/1afAuyrckHabnCP-uhOqXOQzFUuA4e6yN/edit?usp=sharing&ouid=100180767885483338723&rtpof=true&sd=true">
              Conditions of Use
            </Link>
          </Typography>
        </Box>
      </Box>
    );
}

export default Footer;
